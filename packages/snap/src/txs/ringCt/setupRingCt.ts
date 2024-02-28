import { Curve, CurveName, Point, keccak256, maskAmount } from "../../utils";
import { CoinbaseUTXO, LightRangeProof, PaymentUTXO, UnsignedPaymentTX } from "../../interfaces";
import { getLocalUtxos, resetState, saveUtxos } from "../../utils/utxoDB";
import { randomBigint } from "@cypherlab/types-ring-signature/dist/src/utils/randomNumbers";
import { getRangeProof } from "../../utils/rangeProof";
import { userSpendPriv, userSpendPub, userViewPub } from "../../keys";
const G = (new Curve(CurveName.SECP256K1)).GtoPoint();
const H = G.mult(123n); // NOT SECURE. DO NOT USE IN PRODUCTION


/**
 * Setup a ringCT transaction (only payment for now, exit tx coming soon)
 */
export async function setupRingCt(
  outputs: { recipientViewPub: string, recipientSpendPub: string, value: bigint }[],
  fee: bigint
): Promise<{ unsignedTx: UnsignedPaymentTX, inputs: (PaymentUTXO | CoinbaseUTXO)[], outputs: [PaymentUTXO, bigint][] }> {
  const viewPub = Point.decompress(await userViewPub());
  const spendPriv = await userSpendPriv();
  const spendPub = Point.decompress(await userSpendPub());

  const totalAmount = outputs.reduce((acc, output) => acc + output.value, 0n);

  await resetState();// todo: remove for prod
  /* ----------------------------MOCK UTXO---------------------------- */
  const rMock = randomBigint((new Curve(CurveName.SECP256K1)).N);
  const value = 153n;
  const bf = 6154675761567155167161n;
  const mockedUtxo: PaymentUTXO = {
    version: "version",
    transaction_hash: "transaction_hash",
    output_index: 0,
    public_key: G.mult(BigInt(keccak256(viewPub.mult(rMock).compress()))).add(spendPub).compress(), // public key of the owner of the utxo
    amount: maskAmount(viewPub, rMock, value),
    currency: "ETH", // currency -> TODO: find a way to encrypt it too
    commitment: G.mult(bf).add(H.mult(value)).compress(),
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
    } satisfies LightRangeProof,
    rG: G.mult(rMock).compress(),
  } satisfies PaymentUTXO;
  await saveUtxos([mockedUtxo])
  /* ----------------------------------------------------------------- */


  // get all the utxos from the metamask storage
  const utxos = await getLocalUtxos();

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
  const outputUtxos: PaymentUTXO[] = outputs.map((output, index) => {
    const receiverPubKey = G.mult(
      BigInt(keccak256(
        Point.decompress(output.recipientViewPub).mult(r).compress()))
    ).add(Point.decompress(output.recipientSpendPub)).compress();

    const bf = BigInt(keccak256("commitment mask" + keccak256(Point.decompress(output.recipientViewPub).mult(r).compress()) + index.toString()));
    const commitment = G.mult(bf).add(H.mult(outputs[index]!.value)).compress();

    blindingFactors.push(bf);
    totalSent += output.value;

    return {
      version: "0x00",
      transaction_hash: "transaction_hash",
      output_index: index,
      public_key: receiverPubKey, // public key of the owner of the utxo
      amount: maskAmount(G.mult(BigInt("0xa77a293237ea6d1539f1608665fe0b7135115e4acc6ffeafa56e676dac88ce6d")), 123n, output.value), // encrypted amount + blinding factor, only the owner can decrypt it (if coinbase, the amount is clear and there is no blinding factor)
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

  });

  // if total sent > totalAmount + fee, create a new utxo for the change
  if (totalSent > totalAmount + fee) {
    const change = totalSent - totalAmount - fee;
    const bf = BigInt(keccak256("commitment mask" + keccak256(viewPub.mult(r).compress())));
    const commitment = G.mult(bf).add(H.mult(change)).compress();
    outputUtxos.push({
      version: "0x00",
      transaction_hash: "transaction_hash",
      output_index: outputs.length,
      public_key: viewPub.compress(), // todo: find a way to generate 1 time addresses with an index so the user can have multiple change addresses (if not he will only be able to spend 1 utxo)
      amount: maskAmount(viewPub, spendPriv, change), // encrypted amount + blinding factor, only the owner can decrypt it (if coinbase, the amount is clear and there is no blinding factor)
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
  }

  // generate the tx
  const tx: UnsignedPaymentTX = {
    inputs: selectedUtxos.map(utxo => (keccak256(JSON.stringify(utxo)))),
    outputs: outputUtxos.map(utxo => (keccak256(JSON.stringify(utxo)))), 
    fee: '0x' + fee.toString(16),
  } satisfies UnsignedPaymentTX;


  // return the tx
  return { unsignedTx: tx, inputs: selectedUtxos, outputs: outputUtxos.map((utxo, index) => ([utxo, blindingFactors[index]!])) };
}
