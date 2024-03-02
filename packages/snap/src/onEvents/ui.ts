import {
  ButtonType,
  Panel,
  button,
  copyable,
  divider,
  form,
  heading,
  input,
  panel,
  row,
  text,
} from '@metamask/snaps-sdk';
import { api, locale, pubKeysFromAddress, userAddress, userSpendPriv, userViewPriv } from "../keys";
import { setupRingCt } from '../txs/ringCt/setupRingCt';
import { CoinbaseUTXO, PaymentUTXO, SignedPaymentTX } from '../interfaces';
import { Point, amountToString, generateRing, keccak256, unmaskAmount } from '../utils';
import { signRingCtTX } from '../snap-api';
import { broadcastTx } from '../txs/broadcastTx';
import { getLocalUtxos, removeUtxos } from '../utils/utxoDB';
import { checkSendTxParams } from './onUserInput';
import { amountFromString } from '../utils/convert-types/stringToAmount';
import { stringFromAmount } from '../utils/convert-types/stringFromAmount';
import { getUtxos } from '../node-api/getUtxos';

/**
 * Initiate a new interface with the starting screen.
 *
 * @returns The Snap interface ID.
 */
export async function createInterface(): Promise<string> {
  return await snap.request({
    method: 'snap_createInterface',
    params: await homeUi(),
  });
}

export async function homeUi() {
  // await resetState();
  await getUtxos(api)
  const state = await getLocalUtxos();
  let balance: bigint = 0n;
  for (let amount in state) {
    balance += BigInt(amount) * BigInt(state[amount]!.length);
  }

  const strBalance = stringFromAmount(balance, 18);

  switch (await locale()) {
    case "fr":
      return {
        ui: panel([
          text(`Solde: **${strBalance} ETH**`),
          copyable(await userAddress()),
          button({ value: '💸 Envoyer', name: 'send' }),
          divider(),
          button({ value: '💰 Recevoir', name: 'receive' }),
          divider(),
          button({ value: '🌉 Bridge (Soon ...)', name: 'bridge', variant: 'secondary' }),
          divider(),
          button({ value: '📜 Mes UTXOs', name: 'view-utxos' }),
          divider(),
          text("Développé par [Cypher Lab 🔗](https://www.cypherlab.org/)"),
        ]),
      }

    default:
      return {
        ui: panel([
          text(`Balance: **${strBalance} ETH**`),
          copyable(await userAddress()),
          button({ value: '💸 Send', name: 'send' }),
          divider(),
          button({ value: '💰 Receive', name: 'receive' }),
          divider(),
          button({ value: '🌉 Bridge (Soon ...)', name: 'bridge', variant: 'secondary' }),
          divider(),
          button({ value: '📜 View UTXOs', name: 'view-utxos' }),
          divider(),
          text("Powered by [Cypher Lab 🔗](https://www.cypherlab.org/)"),
        ]),
      }
  }
}


/**
 * Update the interface with a simple form containing an input and a submit button.
 *
 * @param id - The Snap interface ID to update.
 */
export async function newTx(id: string) {
  const state = await getLocalUtxos();
  let balance: bigint = 0n;
  for (let amount in state) {
    balance += BigInt(amount) * BigInt(state[amount]!.length);
  }

  const strBalance = stringFromAmount(balance, 18);

  switch (await locale()) {
    case 'fr':
      return await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: panel([
            heading('Envoyer'),
            text(`Solde: **${strBalance} ETH**`),
            form({
              name: 'valid-tx',
              children: [
                input({ name: 'tx-receiver', label: 'Adresse du destinataire' }),
                input({ name: 'amount', label: 'Montant (ETH)', inputType: "number" }),
                input({ name: 'fee', label: 'Frais (ETH)', inputType: "number", value: "0.00001" }),
                button('Envoyer de l\'ETH', ButtonType.Submit, 'valid-tx'),
              ],
            }),
            divider(),
            row(" ", text(" ")),
            button({ value: 'Accueil 🏠', name: 'go-home', variant: 'secondary' }),
          ]),
        },
      });
    default:
      return await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: panel([
            heading('Send tokens'),
            text(`Balance: **${strBalance} ETH**`),
            form({
              name: 'valid-tx',
              children: [
                input({ name: 'tx-receiver', label: 'Receiver Address' }),
                input({ name: 'amount', label: 'Amount (ETH)', inputType: "number" }),
                input({ name: 'fee', label: 'Fee (ETH)', inputType: "number", value: "0.00001" }),
                button('Send ETH', ButtonType.Submit, 'valid-tx'),
              ],
            }),
            divider(),
            row(" ", text(" ")),
            button({ value: 'Home 🏠', name: 'go-home', variant: 'secondary' }),
          ]),
        },
      });
  }
}

/**
 * Update a Snap interface to broadcast  tx
 *
 * @param id -  The interface ID to update.
 */
export async function sendTxFromExpended(id: string, event: any): Promise<{ ui: Panel }> {
  if (!checkSendTxParams(event)) throw new Error("Invalid parameters");
  const data = [{ address: event.value['tx-receiver']!, value: BigInt(event.value['amount']!) }]
  const fee = BigInt(event.value['fee']!);

  const { unsignedTx, inputs, outputs } = await setupRingCt(data, fee);

  // get the blinding factors and sum them
  const viewPriv = await userViewPriv();
  const spendPriv = await userSpendPriv();

  const inputsCommitmentsPrivateKey = inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO), index) => {
    if (utxo.currency !== "ETH") throw new Error("currency not supported");
    // get the blinding factor from input utxo
    return BigInt(keccak256("commitment mask" + keccak256(Point.decompress(utxo.rG).mult(viewPriv).compress()) + index.toString()));
  }).reduce((acc, curr) => acc + curr, 0n);

  const ring = await generateRing(BigInt(outputs.length));

  const signedTx = {
    ...unsignedTx,
    signature: await signRingCtTX(
      JSON.stringify(unsignedTx),
      {
        utxoPrivKeys: outputs.map(utxo => BigInt(keccak256(Point.decompress(utxo[0]!.rG).mult(viewPriv).compress())) + spendPriv),
        commitmentKey: inputsCommitmentsPrivateKey - outputs.map((outputData: [PaymentUTXO, bigint]) => outputData[1]).reduce((acc, curr) => acc + curr, 0n)
      },
      ring,
      {
        utxoData: await data.reduce(async (acc, curr,) => ({ ...acc, [(await pubKeysFromAddress(curr.address)).viewPub]: { currency: "ETH", value: curr.value, decimals: 18 } }), {}),
        fee
      },
      true
    )
  } satisfies SignedPaymentTX;
  // broadcast the tx
  let txId = "Error";
  let broadcasted = false;
  try {
    txId = await broadcastTx(api, signedTx, outputs.map(utxo => utxo[0]!));
    broadcasted = true;
  } catch (e) {
    console.error(e);
    // txId = "Error while broadcasting tx: " + e;
  }

  if (broadcasted) {
    // remove the utxos from the local storage
    await removeUtxos(inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => ({ utxo, amount: unmaskAmount(viewPriv, utxo.rG, utxo.amount).toString() })));
  }
  console.log("before display: ", txId);
  switch (await locale()) {
    case 'fr':
      return {
        ui: panel([
          heading('Tokens envoyés'),
          text('Transaction diffusée avec l\'id:'),
          copyable(txId),
          divider(),
          text('Vous avez envoyé:'),
          copyable(amountToString(data[0]!.value, 18) + " ETH"),
          text('À:'),
          copyable(data[0]!.address),
          text('Avec des frais de:'),
          copyable(amountToString(fee, 18) + " ETH"),
          divider(),
          button({ value: 'Accueil 🏠', name: 'go-home', variant: 'secondary' }),
        ]),
      }
    default:
      return {
        ui: panel([
          heading('Tokens sent'),
          text('Transaction broadcasted with id:'),
          copyable(txId),
          divider(),
          text('You sent:'),
          copyable(amountToString(data[0]!.value, 18) + " ETH"),
          text('To:'),
          copyable(data[0]!.address),
          text('With a fee of:'),
          copyable(amountToString(fee, 18) + " ETH"),
          divider(),
          button({ value: 'Home 🏠', name: 'go-home', variant: 'secondary' }),
        ]),
      }
  }
}


/**
 * Update a Snap interface to display validation screen
 * the transaction from state.
 *
 * @param id -  The interface ID to update.
 */
export async function validTx(id: string, event: any): Promise<{ ui: Panel }> {
  if (!checkSendTxParams(event)) throw new Error("Invalid parameters");

  const data = { address: event.value['tx-receiver']!, value: event.value['amount']! };
  const fee = event.value['fee']!;

  switch (await locale()) {
    case 'fr':
      return {
        ui: panel([
          heading('Tokens envoyés'),
          text('Vous êtes sur le point d\'envoyer :'),
          copyable(data.value.toString() + " ETH"),
          text('À:'),
          copyable(data.address),
          text('Avec des frais de:'),
          copyable(fee.toString() + " ETH"),
          button({ value: 'Signer 🚀', name: 'submit-tx+' + JSON.stringify({ 'tx-receiver': event.value['tx-receiver']!, amount: amountFromString(event.value['amount']!, 18).toString(), fee: amountFromString(fee, 18).toString() }), variant: 'primary' }),
          button({ value: 'Annuler', name: 'go-home', variant: 'secondary' }),
        ]),
      }
    default:
      return {
        ui: panel([
          heading('Send tokens'),
          text('You are about to send :'),
          copyable(data.value.toString() + " ETH"),
          text('To:'),
          copyable(data.address),
          text('With a fee of:'),
          copyable(fee.toString() + " ETH"),
          button({ value: 'Sign 🚀', name: 'submit-tx+' + JSON.stringify({ 'tx-receiver': event.value['tx-receiver']!, amount: amountFromString(event.value['amount']!, 18).toString(), fee: amountFromString(fee, 18).toString() }), variant: 'primary' }),
          button({ value: 'Cancel', name: 'go-home', variant: 'secondary' }),
        ]),
      }
  }

}


export async function displayUtxos() {
  const state = await getLocalUtxos();

  // order utxos by amount
  let utxos: { amount: string, utxos: (PaymentUTXO | CoinbaseUTXO)[] }[] = [];
  let balance: bigint = 0n;
  for (let amount in state) {
    utxos.push({ amount, utxos: state[amount]! });
    balance += BigInt(amount) * BigInt(state[amount]!.length);
  }
  utxos = utxos.sort((a, b) => BigInt(a.amount) < BigInt(b.amount) ? -1 : 1);

  const strBalance = stringFromAmount(balance, 18);

  // display utxos
  let toDisplay: any[] = []
  for (let i = 0; i < utxos.length; i++) {
    toDisplay.push(
      await Promise.all(
        utxos[i]!.utxos.map(async (utxo, index) => {
          switch (await locale()) {
            case 'fr':
              return panel([
                text(`UTXO ${index + 1}`),
                text(`Version: ${utxo.version}`),
                text(`Montant: ${stringFromAmount(BigInt(utxos[i]!.amount), 18)} ETH`),
                text(`Clé publique: ${utxo.public_key}`),
                text(`Devise: ${utxo.currency}`),
                text(`Hash de transaction: ${utxo.transaction_hash}`),
                text(`Index de sortie: ${utxo.output_index}`),
                divider(),
              ]);

            default:
              return panel([
                text(`UTXO ${index + 1}`),
                text(`Version: ${utxo.version}`),
                text(`Amount: ${stringFromAmount(BigInt(utxos[i]!.amount), 18)} ETH`),
                text(`Public Key: ${utxo.public_key}`),
                text(`Currency: ${utxo.currency}`),
                text(`Transaction hash: ${utxo.transaction_hash}`),
                text(`Output index: ${utxo.output_index}`),
                divider(),
              ]);
          }
        }))
    );
  }

  switch (await locale()) {
    case 'fr':
      return {
        ui: panel([
          heading('Vos UTXOs'),
          text(`Solde: **${strBalance} ETH**`),
          button({ value: 'Accueil 🏠', name: 'go-home', variant: 'secondary' }),
          divider(),
          ...(toDisplay.flat()),
          button({ value: 'Accueil 🏠', name: 'go-home', variant: 'secondary' }),
        ]),
      }
    default:
      return {
        ui: panel([
          heading('Your UTXOs'),
          text(`Balance: **${strBalance} ETH**`),
          button({ value: 'Home 🏠', name: 'go-home', variant: 'secondary' }),
          divider(),
          ...(toDisplay.flat()),
          button({ value: 'Home 🏠', name: 'go-home', variant: 'secondary' }),
        ]),
      }
  }
}