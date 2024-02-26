import { CoinbaseUTXO, PaymentUTXO, UTXO, UtxoStorage } from "src/interfaces";
import { unmaskAmount } from "./amountMask";
import { cypherViewPriv } from "../keys";
import { Point } from "@cypherlab/types-ring-signature";
import { Json } from "@metamask/snaps-sdk";

export async function saveUtxos(utxos: (PaymentUTXO | CoinbaseUTXO)[]): Promise<void> {


  // get state
  let state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  // add the utxos
  for (let i = 0; i < utxos.length; i++) {
    // get utxo amount
    const clearAmount = unmaskAmount(await cypherViewPriv, Point.decompress(utxos[i]!.rG), utxos[i]!.amount).toString();

    if(!state[clearAmount]) state[clearAmount] = JSON.stringify([] as UTXO[]);
    // add utxo to state
    state[clearAmount] = JSON.stringify([...JSON.parse(state[clearAmount]!), utxos[i]]);
  }

  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state as Record<string, Json> },
  });

}

export async function getUtxos(): Promise<{ [amount: string]: (PaymentUTXO | CoinbaseUTXO)[]}> {
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

export async function removeUtxo(amount: string, utxo: (PaymentUTXO | CoinbaseUTXO)): Promise<void> {
  // get state
  let state: UtxoStorage = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) as object as UtxoStorage;

  // remove utxo where amount matches and utxo matches
  state[amount] = JSON.parse(state[amount]!).filter((u: UTXO) => JSON.stringify(u) !== JSON.stringify(utxo));
  
  // save state
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state as Record<string, Json> },
  });
}