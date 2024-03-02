import { keccak256 } from "../utils";
import { SignedPaymentTX, UTXO } from "../interfaces";

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


  // const txToBroadcast = { // todo -> this one makes more sense
  //   hash: hash,
  //   signature: signedTx.signature, // tx mlsag hex signature
  //   outputList: outputs // UTXOs to be created
  // } satisfies TxToRpc;

  const txToBroadcast = {
    hash: hash,
    inputs: signedTx.inputs,
    outputs: outputs.map(utxo => { return { ...utxo, hash: keccak256(JSON.stringify(utxo)) }; }),
    fee: signedTx.fee,
    signature: signedTx.signature
  };
  console.log("txToBroadcast: \n", JSON.stringify(txToBroadcast));

  try {
    // send the tx to the network
    const body = JSON.stringify(txToBroadcast);
    await fetch(`${api}/ringct`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json"
      }
    }).then(res => res.json());
  } catch (e) {
    console.error(e);
  }
  console.log("txId: ", txToBroadcast.hash);
  console.log("test: ", keccak256([
    ...Buffer.from(JSON.stringify(signedTx.inputs)),
    ...Buffer.from(JSON.stringify(signedTx.outputs)),
    ...Buffer.from(signedTx.fee),
    ...Buffer.from(signedTx.signature)
  ].map((byte) => BigInt(byte))));
  return txToBroadcast.hash;
  // return (await fetch('https://beaconcha.in/api/v1/execution/gasnow')).text(); 
}

// fetch("http://176.146.201.74:3000/block/number/1").then(res => res.json()).then(console.log);