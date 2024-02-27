import { CoinbaseUTXO, PaymentUTXO, UTXO, UtxoStorage } from "../interfaces";
import { Json } from "@metamask/snaps-sdk";
// import { Point } from ".";
// import { keccak256 } from ".";
import { unmaskAmount } from "./amountMask";
import { Curve, CurveName } from ".";

const G = (new Curve(CurveName.SECP256K1)).GtoPoint();

const userViewPriv = 999999999999999999999999999999999n;
const userSpendPriv = 8888888888888888888888888888888888n;
const userViewPub = G.mult(userViewPriv);
const userSpendPub = G.mult(userSpendPriv);
const senderMock = { viewPriv: 1777776667777777777n, spendPriv: 2776477777777777778n };


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
    const clearAmount = unmaskAmount(userViewPriv, utxos[i]!.rG, utxos[i]!.amount).toString();

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

export async function getLocalUtxos(): Promise<{ [amount: string]: (PaymentUTXO | CoinbaseUTXO)[] }> {
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
    params: { operation: 'update', newState: {} },
  });
}