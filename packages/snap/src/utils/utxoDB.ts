import { CoinbaseUTXO, PaymentUTXO, UTXO, UtxoStorage } from "../interfaces";
import { Json } from "@metamask/snaps-sdk";
// import { Point } from ".";
// import { keccak256 } from ".";
import { unmaskAmount } from "./amountMask";

export async function saveUtxos(utxos: (PaymentUTXO | CoinbaseUTXO)[]): Promise<void> {

  // get state
  let state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  if (!state) state = {}; // Initialize state as an empty object if it's null or undefined

  // add the utxos
  for (let i = 0; i < utxos.length; i++) {
    // todo: replace by the actual signer pubkey
    const clearAmount = unmaskAmount(BigInt("0xa77a293237ea6d1539f1608665fe0b7135115e4acc6ffeafa56e676dac88ce6d"), utxos[i]!.public_key, utxos[i]!.amount).toString();

    // Check if `state` is initialized and if `clearAmount` key exists or is null
    if (state[clearAmount] === undefined || state[clearAmount] === null) {
      state[clearAmount] = JSON.stringify([]);
    } 
    // Add the utxo to the state
    state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]]);
  }
  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state as Record<string, Json> },
  });

}

export async function getLocalUtxos(): Promise<{ [amount: string]: (PaymentUTXO | CoinbaseUTXO)[]}> {
  // get state
  const state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  let utxos: { [amount: string]: (PaymentUTXO | CoinbaseUTXO)[] } = {};
  // parse state
  for (let amount in state) {
    utxos[amount] = JSON.parse(state[amount]!) as (PaymentUTXO | CoinbaseUTXO)[];
  }

  // return utxos
  return utxos;
}

// export async function removeUtxo(amount: string, utxo: (PaymentUTXO | CoinbaseUTXO)): Promise<void> {
//   // get state
//   let state: UtxoStorage = await snap.request({
//     method: 'snap_manageState',
//     params: { operation: 'get' },
//   }) as object as UtxoStorage;

//   // remove utxo where amount matches and utxo matches
//   state[amount] = JSON.parse(state[amount]!).filter((u: UTXO) => JSON.stringify(u) !== JSON.stringify(utxo));
  
//   // save state
//   await snap.request({
//     method: 'snap_manageState',
//     params: { operation: 'update', newState: state as Record<string, Json> },
//   });
// }




// // unmask the amount of an utxo you own
// function unmaskAmount(receiverViewPriv: bigint, senderSpendPub: string, maskedAmount: string): bigint {
//   const senderPub = Point.decompress(senderSpendPub);
//   // ensure maskedAmount is 8 bytes. If not, pad it with 0
//   if (maskedAmount.length !== 64) {
//     maskedAmount = maskedAmount.padStart(64, "0");
//   }
//   // get the Diffie-Hellman shared secret
//   const sharedSecret = keccak256("amount" + keccak256(senderPub.mult(receiverViewPriv).compress()));

//   // convert the shared secret and the amount to binary and xor the 64 first bits
//   const binaryAmount = (BigInt(sharedSecret) ^ BigInt("0b" + maskedAmount)).toString(2).padStart(64, "0");

//   // convert the binary amount to a base 10 bigint
//   return BigInt("0b" + binaryAmount);
// }



// // Get the Cypher-Zer0x node private key
// const cypherZer0xNode = (async () => {
//   return await snap.request({
//     method: 'snap_getBip44Entropy',
//     params: {
//       coinType: 1,
//     },
//   });
// })();

// export const cypherViewPriv = (async () => {
//   if ((await cypherZer0xNode).privateKey === undefined) throw new Error("undefined private key");
//   return BigInt(keccak256((await cypherZer0xNode).privateKey!.toString() + "VIEW"));
//   // return BigInt((await cypherZer0xNode).privateKey!);
// })();