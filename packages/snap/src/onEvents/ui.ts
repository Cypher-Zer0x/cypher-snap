import {
  ButtonType,
  ManageStateOperation,
  Panel,
  address,
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
import { api, pubKeysFromAddress, userAddress, userSpendPriv, userViewPriv } from "../keys";
import { setupRingCt } from '../txs/ringCt/setupRingCt';
import { CoinbaseUTXO, PaymentUTXO, SignedPaymentTX } from '../interfaces';
import { Point, generateRing, keccak256, unmaskAmount } from '../utils';
import { signRingCtTX } from '../snap-api';
import { broadcastTx } from '../txs/broadcastTx';
import { getLocalUtxos, removeUtxos } from '../utils/utxoDB';
import { checkSendTxParams } from './onUserInput';
import { amountFromString } from '../utils/convert-types/stringToAmount';

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
  return {
    ui: panel([
      heading('**should display eth balance**'),
      copyable(await userAddress()),
      button({ value: 'Send', name: 'send' }),
      divider(),
      button({ value: 'Bridge', name: 'bridge' }),
      divider(),
      // todo: display token balances for each token in state
      row('USDC', text("250.00")),
      row('WBTC', text("0.0024")),
    ]),
  }
}


/**
 * Update the interface with a simple form containing an input and a submit button.
 *
 * @param id - The Snap interface ID to update.
 */
export async function newTx(id: string) {
  return await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: panel([
        heading('Send tokens'),
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
        button({ value: 'Home', name: 'go-home', variant: 'secondary' }),
      ]),
    },
  });
}

/**
 * Update a Snap interface to broadcast  tx
 *
 * @param id -  The interface ID to update.
 */
export async function sendTxFromExpended(id: string, event: any): Promise<{ ui: Panel }> {
  console.log('BEFORE CHECK, sendTxFromExpended', event);
  if (!checkSendTxParams(event)) throw new Error("Invalid parameters");
  console.log('AFTER CHECK, sendTxFromExpended');
  const data = [{ address: event.value['tx-receiver']!, value: BigInt(event.value['amount']!) }]
  const fee = BigInt(event.value['fee']!);


  const { unsignedTx, inputs, outputs } = await setupRingCt(data, fee);

  const avant = await getLocalUtxos();


  // get the blinding factors and sum them
  const viewPriv = await userViewPriv();
  const spendPriv = await userSpendPriv();
  const inputsCommitmentsPrivateKey = inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO), index) => {
    if (utxo.currency !== "ETH") throw new Error("currency not supported");

    // get the blinding factor from input utxo
    return BigInt(keccak256("commitment mask" + keccak256(Point.decompress(utxo.rG).mult(viewPriv).compress()) + index.toString()));
  }).reduce((acc, curr) => acc + curr, 0n);

  const ring = await generateRing();

  const signedTx = {
    ...unsignedTx,
    // message: string,
    // keys: { utxoPrivKeys: bigint[], commitmentKey: bigint },
    // ring: Point[][],
    // txContent: { utxoData: { [recipient: string]: { currency: string, value: bigint, decimals: number } }, fee: bigint }
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
  console.log("signed tx:\n", JSON.stringify(signedTx), "\n");
  // broadcast the tx
  let txId = "Error";
  let broadcasted = false;
  try {
    txId = await broadcastTx(api, signedTx, outputs.map(utxo => utxo[0]!));
    broadcasted = true;
  } catch (e) {
    console.error(e);
    txId = "Error while broadcasting tx: " + e;
  }

  if (broadcasted) {
    // remove the utxos from the local storage
    await removeUtxos(inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => ({ utxo, amount: unmaskAmount(viewPriv, utxo.rG, utxo.amount).toString() })));
  }
 
  return {
    ui: panel([
      heading('Tokens sent'),
      text('Transaction broadcasted with id:'),
      copyable(txId),
      divider(),
      text('You sent:'),
      copyable(data[0]!.value.toString() + " ETH"),
      text('To:'),
      copyable(data[0]!.address),
      text('With a fee of:'),
      copyable(fee.toString() + " ETH"),
      divider(),
      button({ value: 'Home', name: 'go-home', variant: 'secondary' }),
    ]),
  }
}


/**
 * Update a Snap interface to display validation screen
 * the transaction from state.
 *
 * @param id -  The interface ID to update.
 */
export async function validTx(id: string, event: any): Promise<{ ui: Panel }> {
  console.log("BEFORE TEST");
  if (!checkSendTxParams(event)) throw new Error("Invalid parameters");
  console.log("TEST OK");
  console.log("ventouse: ", event);
  const data = { address: event.value['tx-receiver']!, value: event.value['amount']! };
  const fee = event.value['fee']!;

  return {
    ui: panel([
      heading('Send tokens'),
      text('You are about to send :'),
      copyable(data.value.toString() + " ETH"),
      text('To:'),
      copyable(data.address),
      text('With a fee of:'),
      copyable(fee.toString() + " ETH"),
      // form({
      //   name: 'example-form',
      //   children: [
      //     input({
      //       name: 'example-input',
      //       placeholder: 'Enter something...',
      //     }),
      //     button('Submit', ButtonType.Submit, 'sumbit'),
      //   ],
      // }),
      button({ value: 'Sign', name: 'submit-tx+'+ JSON.stringify({ 'tx-receiver': event.value['tx-receiver']!, amount: amountFromString(event.value['amount']!, 18).toString(), fee: amountFromString(fee, 18).toString()}), variant: 'primary'}),
      button({ value: 'Cancel', name: 'go-home', variant: 'secondary' }),
    ]),
  }

}
