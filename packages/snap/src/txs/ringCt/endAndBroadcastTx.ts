import { setupRingCt } from "./setupRingCt"
import { signRingCtTX } from "../../snap-api/signMlsag";
import { CoinbaseUTXO, PaymentUTXO, SignedPaymentTX } from "../../interfaces";
import { Point, generateRing, keccak256, unmaskAmount } from "../../utils";
import { broadcastTx } from "../broadcastTx";
import { getLocalUtxos, removeUtxos } from "../../utils/utxoDB";
import { getBalance } from "../../utxos/getBalance";
import { G, userSpendPriv, userViewPriv  } from "../../keys";

// send a tx to the client
export async function endAndBroadcastTx(api: string, data: { recipientViewPub: string, recipientSpendPub: string, value: bigint }[], fee: bigint): Promise<string> {

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
    signature: await signRingCtTX(
      JSON.stringify(unsignedTx),
      {
        utxoPrivKeys: outputs.map(utxo => BigInt(keccak256(Point.decompress(utxo[0]!.rG).mult(viewPriv).compress())) + spendPriv),
        commitmentKey: inputsCommitmentsPrivateKey - outputs.map((outputData: [PaymentUTXO, bigint]) => outputData[1]).reduce((acc, curr) => acc + curr, 0n)
      },
      ring,
      {
        utxoData: data.reduce((acc, curr) => ({ ...acc, [curr.recipientViewPub]: { currency: "ETH", value: curr.value, decimals: 18 } }), {}),
        fee
      }
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
    txId = "Error while broadcasting tx: " + e;
  }

  if (broadcasted) {
    // remove the utxos from the local storage
    await removeUtxos(inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => ({ utxo, amount: unmaskAmount(viewPriv, utxo.rG, utxo.amount).toString() })));
  }

  await getBalance([...Object.values(avant).flat()], { spendPub: G.mult(spendPriv).compress(), viewPriv: viewPriv });


  const apres = await getLocalUtxos();

  await getBalance([...Object.values(apres).flat()], { spendPub: G.mult(spendPriv).compress(), viewPriv: viewPriv });


  // return the txId
  return txId;
}
