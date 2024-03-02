import { Curve, CurveName, Point, keccak256, maskAmount } from "../../utils";
import { CoinbaseUTXO, LightRangeProof, PaymentUTXO, UnsignedPaymentTX } from "../../interfaces";
import { getLocalUtxos } from "../../utils/utxoDB";
import { randomBigint } from "../../snap-api/signMlsag";
import { userSpendPub, userViewPub, G, H, pubKeysFromAddress } from "../../keys";


/**
 * Setup a ringCT transaction (only payment for now, exit tx coming soon)
 */
export async function setupRingCt(
  outputs: { address: string, value: bigint }[],
  fee: bigint
): Promise<{ unsignedTx: UnsignedPaymentTX, inputs: (PaymentUTXO | CoinbaseUTXO)[], outputs: [PaymentUTXO, bigint][] }> {
  const viewPub = Point.decompress(await userViewPub());

  const totalAmount = outputs.reduce((acc, output) => acc + output.value, 0n);

  // /* ----------------------------MOCK UTXO---------------------------- */
  // const rMock = randomBigint((new Curve(CurveName.SECP256K1)).N);
  // const value = 153n;
  // const bf = 6154675761567155167161n;
  // const mockedUtxo: PaymentUTXO = {
  //   version: "version",
  //   transaction_hash: "transaction_hash",
  //   output_index: 0,
  //   public_key: G.mult(BigInt(keccak256(viewPub.mult(rMock).compress()))).add(spendPub).compress(), // public key of the owner of the utxo
  //   amount: maskAmount(viewPub, rMock, value),
  //   currency: "ETH", // currency -> TODO: find a way to encrypt it too
  //   commitment: G.mult(bf).add(H.mult(value)).compress(),
  //   rangeProof: { // todo: fix: getRangeProof(12345n), -> this range proof is useless since the amount is not linked to the commitment. This needs to be fixed
  //     V: "string",
  //     A: "string",
  //     S: "string",
  //     T1: "string",
  //     T2: "string",
  //     tx: "string",
  //     txbf: "string",
  //     e: "string",
  //     a0: "string",
  //     b0: "string",
  //     ind: [{ L: "string", R: "string" }],
  //   } satisfies LightRangeProof,
  //   rG: G.mult(rMock).compress(),
  // } satisfies PaymentUTXO;
  // await saveUtxos([mockedUtxo])
  // /* ----------------------------------------------------------------- */


  // get all the utxos from the metamask storage
  const utxos = await getLocalUtxos();
  console.log("utxos: ", JSON.stringify(utxos));
  // select the utxos to spend (such as sum of utxos > amount + fee)
  const amounts = Object.keys(utxos);
  const selectedUtxos: (PaymentUTXO | CoinbaseUTXO)[] = [];
  let sum = 0n;
  for (let i = 0; i < amounts.length; i++) {
    const amount = BigInt(amounts[i]!);

    for (let j = 0; j < utxos[amounts[i]!]!.length; j++) {
      selectedUtxos.push(utxos[amounts[i]!]![j]!);
      sum += amount;
      if (sum >= totalAmount + fee) {
        break;
      }
    }
  }

  const r = randomBigint((new Curve(CurveName.SECP256K1)).N);

  // generate the new utxos
  const blindingFactors: bigint[] = [];
  let totalSent = 0n;
  const txHash = keccak256(JSON.stringify(selectedUtxos));
  const outputUtxos: PaymentUTXO[] = await Promise.all(outputs.map(async (output, index) => {
    const recipientsPubKeys = await pubKeysFromAddress(output.address);
    const recipientViewPub = Point.decompress(recipientsPubKeys.viewPub);
    const recipientSpendPub = Point.decompress(recipientsPubKeys.spendPub);
    const receiverPubKey = G.mult(
      BigInt(keccak256(
        recipientViewPub.mult(r).compress()))
    ).add(recipientSpendPub).compress();

    const bf = BigInt(keccak256("commitment mask" + keccak256(recipientViewPub.mult(r).compress()) + index.toString()));
    const commitment = G.mult(bf).add(H.mult(outputs[index]!.value)).compress();

    blindingFactors.push(bf);
    totalSent += output.value;
    console.log("recipientViewPub: \n", recipientViewPub.compress());

    return {
      version: "0x00",
      transaction_hash: txHash,
      output_index: index,
      public_key: receiverPubKey, // public key of the owner of the utxo
      amount: maskAmount(recipientViewPub, r, output.value), // encrypted amount + blinding factor, only the owner can decrypt it (if coinbase, the amount is clear and there is no blinding factor)
      currency: "ETH", // currency -> TODO: find a way to encrypt it too
      commitment: commitment, // (compressed point) -> a cryptographic commitment to the amount, allows verification without revealing the amount
      rangeProof: { // todo: fix: getRangeProof(12345n), -> this range proof is useless since the amount is not linked to the commitment. This needs to be fixed
        V: "string",
        A: "string",
        S: "string",
        T1: "string",
        T2: "string",
        tx: "string",
        txbf: "string",
        e: "string",
        a0: "string",
        b0: "string",
        ind: [{ L: "string", R: "string" }],
      } satisfies LightRangeProof, // getRangeProof(output.value),
      rG: G.mult(r).compress(), // rG = G*r
    } satisfies PaymentUTXO;

  }));
  console.log("total sent:", sum, "needed: ", totalAmount + fee, "expected change: ", sum - totalAmount - fee);
  // if total sent > totalAmount + fee, create a new utxo for the change
  if (sum > totalAmount + fee) {
    const r = randomBigint((new Curve(CurveName.SECP256K1)).N);
    // console.log("totalSent > totalAmount + fee: ", sum > totalAmount + fee);
    const change = sum - totalAmount - fee;
    if (change < 0) throw new Error("change < 0");
    const bf = BigInt(keccak256("commitment mask" + keccak256(viewPub.mult(r).compress())));
    const commitment = G.mult(bf).add(H.mult(change)).compress();
    outputUtxos.push({
      version: "0x00",
      transaction_hash: "transaction_hash",
      output_index: outputs.length,
      public_key: viewPub.compress(), // todo: find a way to generate 1 time addresses with an index so the user can have multiple change addresses (if not he will only be able to spend 1 utxo)
      amount: maskAmount(viewPub, r, change), // encrypted amount + blinding factor, only the owner can decrypt it (if coinbase, the amount is clear and there is no blinding factor)
      currency: "ETH", // currency -> TODO: find a way to encrypt it too
      commitment: commitment, // (compressed point) -> a cryptographic commitment to the amount, allows verification without revealing the amount
      rangeProof: { // todo: fix: getRangeProof(12345n), -> this range proof is useless since the amount is not linked to the commitment. This needs to be fixed
        V: "string",
        A: "string",
        S: "string",
        T1: "string",
        T2: "string",
        tx: "string",
        txbf: "string",
        e: "string",
        a0: "string",
        b0: "string",
        ind: [{ L: "string", R: "string" }],
      } satisfies LightRangeProof, // getRangeProof(change),
      rG: G.mult(r).compress(), // rG = G*r
    } satisfies PaymentUTXO);

    blindingFactors.push(bf);
  }
  console.log("avant tx");
  // generate the tx
  const tx: UnsignedPaymentTX = {
    inputs: selectedUtxos.map(utxo => (utxo as any).hash),
    outputs: outputUtxos.map(utxo => (keccak256(JSON.stringify(utxo)))),
    fee: '0x' + fee.toString(16),
  } satisfies UnsignedPaymentTX;
  console.log("avant tx2");
  // todo: mix outputs order to avoid always having the change output at the end of the tx

  // return the tx
  return { unsignedTx: tx, inputs: selectedUtxos, outputs: outputUtxos.map((utxo, index) => ([utxo, blindingFactors[index]!])) };
}
