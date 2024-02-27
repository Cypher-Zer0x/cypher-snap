import { CoinbaseUTXO, ExitUTXO, PaymentUTXO, UTXO } from "../interfaces";

// Type guard for CoinbaseUTXO
export function isCoinbaseUTXO(utxo: UTXO): utxo is CoinbaseUTXO {
  return (utxo as CoinbaseUTXO).rG !== undefined && (utxo as PaymentUTXO).rangeProof === undefined;
}

// Type guard for PaymentUTXO
export function isPaymentUTXO(utxo: UTXO): utxo is PaymentUTXO {
  return (utxo as PaymentUTXO).rangeProof !== undefined;
}

// Type guard for ExitUTXO
export function isExitUTXO(utxo: UTXO): utxo is ExitUTXO {
  return (utxo as ExitUTXO).exitChain !== undefined && (utxo as PaymentUTXO).rangeProof === undefined;
}


// export { getBalance } from "./getBalance";
