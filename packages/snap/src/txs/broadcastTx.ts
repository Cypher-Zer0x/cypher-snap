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

  //  pub fn new(inputs: Vec<String>, outputs: Vec<UTXO>, signature: String) -> PendingRingCT {
  //   let inputs_bytes = bincode::serialize(&inputs).unwrap();
  //   let outputs_bytes = bincode::serialize(&outputs).unwrap();
  //   let bytes = [inputs_bytes, outputs_bytes].concat();
  //   PendingRingCT {
  //       inputs,
  //       outputs,
  //       hash: hex::encode(keccak256(&bytes)).to_string(),
  //       signature,
  //   }
  // convert the inputs and outputs to bytes, concatenate them and hash the result
  const hash = keccak256([
    ...Buffer.from(JSON.stringify(signedTx.inputs)),
    ...Buffer.from(JSON.stringify(outputs)),
    ...Buffer.from(signedTx.fee)
  ].map((byte) => BigInt(byte)));


  const txToBroadcast = {
    inputs: signedTx.inputs, // inputs of the transaction from the UTXO set
    outputs: outputs, // UTXOs to be created
    hash: hash,      // 
    signature: signedTx.signature, // tx mlsag signature
  } satisfies TxToRpc;

  console.log("api: ", api, 'full: ' + `${api}/ringct`);
  console.log("txToBroadcast: `n", JSON.stringify(txToBroadcast));

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