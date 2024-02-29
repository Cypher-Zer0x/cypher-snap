import { setupRingCt } from "./setupRingCt"
import { signRingCtTX } from "../../snap-api/signMlsag";
import { CoinbaseUTXO, PaymentUTXO, SignedPaymentTX } from "../../interfaces";
import { Point, generateRing, keccak256, unmaskAmount } from "../../utils";
import { broadcastTx } from "../broadcastTx";
import { getLocalUtxos, removeUtxos } from "../../utils/utxoDB";
import { getBalance } from "../../utxos/getBalance";
import { G, pubKeysFromAddress, userSpendPriv, userViewPriv } from "../../keys";

// send a tx to the client
export async function createAndBroadcastTx(api: string, data: { address: string, value: bigint }[], fee: bigint): Promise<string> {

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
      }
    )
  } satisfies SignedPaymentTX;
  console.log("signed tx");
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

  const apres = await getLocalUtxos();

  const totalInputsAmount = Object.values(avant).flat().reduce((acc, curr) => acc + unmaskAmount(viewPriv, curr.rG, curr.amount), 0n);
  const totalOutputsAmount = unmaskAmount(11n, outputs[0]![0].rG, outputs[0]![0].amount) + unmaskAmount(await userViewPriv(), outputs[1]![0].rG, outputs[1]![0].amount)
  const totalFee = totalInputsAmount - totalOutputsAmount;//.reduce((acc, curr) => acc + curr, 0n);
console.log("rrrrrrr\n", Object.values(apres).flat());
  console.log("amount verif: \n",
    totalInputsAmount.toString(), "\n",
    totalOutputsAmount.toString(), "\n",
    totalFee.toString(), "\n",
    "change: ", totalInputsAmount - totalFee - unmaskAmount(11n, outputs[0]![0].rG, outputs[0]![0].amount),
  )

  // return the txId
  return txId;
}
