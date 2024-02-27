import { setupRingCt } from "./setupRingCt"
import { signRingCtTX } from "../../snap-api/signMlsag";
import { CoinbaseUTXO, PaymentUTXO } from "../../interfaces";
import { generateRing, unmaskAmount } from "../../utils";

// send a tx to the client
export async function endAndBroadcastTx(data: { recipientViewPub: string, recipientSpendPub: string, value: bigint }[], fee: bigint): Promise<string> {
  const {unsignedTx, inputs, outputs} = await setupRingCt(data, fee);

  // get the blinding factors and sum them
  const inputsCommitmentsPrivateKey = inputs.map((utxo: (PaymentUTXO | CoinbaseUTXO)) => {
    // get the blinding factor from input utxo
    return unmaskAmount(123n, utxo.public_key, utxo.amount);
  }).reduce((acc, curr) => acc + curr, 0n);

  const ring = await generateRing();

  const signedTx = signRingCtTX(
    JSON.stringify(unsignedTx),
    { 
      utxoPrivKeys: inputs.map(utxo => 123n), 
      commitmentKey: inputsCommitmentsPrivateKey - outputs.map((outputData: [PaymentUTXO, bigint]) => outputData[1]).reduce((acc, curr) => acc + curr, 0n)
    },
    ring,
    { 
      utxoData: data.reduce((acc, curr) => ({...acc, [curr.recipientViewPub]: { currency: "ETH", value: curr.value, decimals: 18 }}), {}), 
      fee 
    }
  );

  // broadcast the tx

  // return the txId
  return signedTx; // return txId
}
