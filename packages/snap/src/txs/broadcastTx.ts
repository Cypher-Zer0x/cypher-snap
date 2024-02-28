import { keccak256 } from "../utils";
import { SignedPaymentTX, TxToRpc, UTXO } from "../interfaces";

/**
 * Broadcast a transaction to the network
 * 
 * @param tx - The transaction to broadcast (hex string)
 * 
 * @returns - The transaction hash or an error message
 */
export async function broadcastTx(api: string, signedTx: SignedPaymentTX, outputs: UTXO[]): Promise<string> {


  // convert the inputs, outputs, fee and sig to bytes, concatenate them and hash the result
  const hash = keccak256([
    ...Buffer.from(JSON.stringify(signedTx.inputs)),
    ...Buffer.from(JSON.stringify(signedTx.outputs)),
    ...Buffer.from(signedTx.fee),
    ...Buffer.from(signedTx.signature)
  ].map((byte) => BigInt(byte)));


  const txToBroadcast = {
    hash: hash,
    signature: signedTx.signature, // tx mlsag hex signature
    outputList: outputs // UTXOs to be created
  } satisfies TxToRpc;


  // send the tx to the network
  const body = JSON.stringify(txToBroadcast);
  const txId = await fetch(`${api}/ringct`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.json());

  console.log("txId: ", txId);
  return txId
  // return (await fetch('https://beaconcha.in/api/v1/execution/gasnow')).text(); 
}

// fetch("http://176.146.201.74:3000/block/number/1").then(res => res.json()).then(console.log);