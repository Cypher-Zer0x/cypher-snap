import { setupRingCt } from "./setupRingCt"
import { signRingCtTX } from "../../snap-api/signMlsag";
import { CoinbaseUTXO, PaymentUTXO } from "../../interfaces";
import { Curve, CurveName, Point, generateRing, keccak256, unmaskAmount } from "../../utils";
import { broadcastTx } from "../broadcastTx";
import { getLocalUtxos, removeUtxos } from "../../utils/utxoDB";
import { getBalance } from "../../utxos/getBalance";
// import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';

const G = (new Curve(CurveName.SECP256K1)).GtoPoint();

const userViewPriv = 999999999999999999999999999999999n;
const userSpendPriv = 8888888888888888888888888888888888n;


// send a tx to the client
export async function endAndBroadcastTx(data: { recipientViewPub: string, recipientSpendPub: string, value: bigint }[], fee: bigint): Promise<string> {

  const { unsignedTx, inputs, outputs } = await setupRingCt(data, fee);

  const avant = await getLocalUtxos();

  // get the blinding factors and sum them
  const inputsCommitmentsPrivateKey = inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => {
    // get the blinding factor from input utxo
    return unmaskAmount(userViewPriv, utxo.public_key, utxo.amount);
  }).reduce((acc, curr) => acc + curr, 0n);

  const ring = await generateRing();

  const signedTx = signRingCtTX(
    JSON.stringify(unsignedTx),
    {
      utxoPrivKeys: outputs.map(utxo => BigInt(keccak256(Point.decompress(utxo[0]!.rG).mult(userViewPriv).compress())) + userSpendPriv),
      commitmentKey: inputsCommitmentsPrivateKey - outputs.map((outputData: [PaymentUTXO, bigint]) => outputData[1]).reduce((acc, curr) => acc + curr, 0n)
    },
    ring,
    {
      utxoData: data.reduce((acc, curr) => ({ ...acc, [curr.recipientViewPub]: { currency: "ETH", value: curr.value, decimals: 18 } }), {}),
      fee
    }
  );

  // broadcast the tx
  let txId = "Error";
  let broadcasted = false;
  try {
    txId = await broadcastTx(await signedTx);
    broadcasted = true;
  } catch (e) {
    console.error(e);
    txId = "Error while broadcasting tx: " + e;
  }

  if (broadcasted) {
    // remove the utxos from the local storage
    await removeUtxos(inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => ({ utxo, amount: unmaskAmount(userViewPriv, utxo.rG, utxo.amount).toString() })));
  }

  await getBalance([...Object.values(avant).flat()], { spendPub: G.mult(userSpendPriv).compress(), viewPriv: userViewPriv });


  const apres = await getLocalUtxos();

  // let confirmation = await snap.request({ // for debug purposes
  //   method: 'snap_dialog',
  //   params: {
  //     type: 'confirmation',
  //     content: panel([
  //       heading('MLSAG Request'),
  //       text('You are about to sign a message with MLSAG. Please review the details and confirm.'),
  //       divider(),
  //       text('utxos avant:'),
  //       copyable(JSON.stringify(avant)),
  //       divider(),
  //       text('utxos apres:'),
  //       copyable(JSON.stringify(apres)),
  //       divider(),
  //       text('inputs:'),
  //       copyable(`${JSON.stringify({amount: unmaskAmount(userViewPriv, inputs[0]!.rG, inputs[0]!.amount).toString()})}`),
  //     ])
  //   },
  // });

  await getBalance([...Object.values(apres).flat()], { spendPub: G.mult(userSpendPriv).compress(), viewPriv: userViewPriv });


  // return the txId
  return txId;
}
