import { CoinbaseUTXO, PaymentUTXO, UtxoStorage } from "../interfaces";
import { Json } from "@metamask/snaps-sdk";
import { unmaskAmount } from "./amountMask";
import { userViewPriv } from "../keys";
import { isCoinbaseUTXO } from "../utxos";


export async function saveUtxos(utxos: (PaymentUTXO | CoinbaseUTXO)[]): Promise<void>{
  await resetState();
  // get state
  let state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  if (!state) state = {}; // Initialize state as an empty object if it's null or undefined

  // add the utxos
  for (let i = 0; i < utxos.length; i++) {
    let clearAmount: string = String(utxos[i]!.amount);
    // if utxo is coinbase, amount is clear
    if (!isCoinbaseUTXO(utxos[i]!)) {
      clearAmount = unmaskAmount(await userViewPriv(), utxos[i]!.rG, utxos[i]!.amount).toString();
    }
    // Check if `state` is initialized and if `clearAmount` key exists or is null
    if (state[clearAmount] === undefined || state[clearAmount] === null) {
      state[clearAmount] = JSON.stringify([]);
    }
    // if no element of state[clearAmount] has the same public key as utxos[i], add the utxo to the state
    // state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]]);
    // if no element of state[clearAmount] has the same public key as utxos[i], add the utxo to the state
    if (!JSON.parse(state[clearAmount]!).some((u: PaymentUTXO | CoinbaseUTXO) => u.public_key === utxos[i]!.public_key)) {
      state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]!]);
    }
  }

  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state as Record<string, Json> },
  });

}

export async function getLocalUtxos(): Promise<{ [amount: string]: (PaymentUTXO | CoinbaseUTXO)[] }> {
  // get state
  const state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  let utxos: { [amount: string]: (PaymentUTXO | CoinbaseUTXO)[] } = {};
  // parse state
  for (let amount in state) {
    if(BigInt(amount) <= 0n || BigInt(amount) >= 0xFFFFFFFFFFFFFFFFn ) continue;
    utxos[amount] = JSON.parse(state[amount]!) as (PaymentUTXO | CoinbaseUTXO)[];
  }

  // return utxos
  return utxos;
}

export async function removeUtxos(utxos: { utxo: (PaymentUTXO | CoinbaseUTXO), amount: string }[]): Promise<void> {
  // get state
  let state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  for (let i = 0; i < utxos.length; i++) {
    if (state[utxos[i]!.amount] === undefined || state[utxos[i]!.amount] === null) {
      console.warn("Trying to remove a utxo that does not exist: ", utxos[i]!.utxo.public_key, utxos[i]!.amount);
    } else {
      // remove utxo where amount matches and utxo matches
      // state[utxos[i]!.amount] = JSON.parse(state[utxos[i]!.amount]!).filter((u: UTXO) => JSON.stringify(u) !== JSON.stringify(utxos[i]!.utxo));
      state[utxos[i]!.amount] = JSON.stringify(
        (JSON.parse(state[utxos[i]!.amount]!) as (PaymentUTXO | CoinbaseUTXO)[])
          .filter((u: PaymentUTXO | CoinbaseUTXO) => (u.public_key !== utxos[i]!.utxo.public_key && u.amount !== utxos[i]!.utxo.amount))
      );

    }
  }

  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state as Record<string, Json> },
  });
}

export async function resetState(): Promise<void> {
  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: {} as Record<string, Json> },
  });
}