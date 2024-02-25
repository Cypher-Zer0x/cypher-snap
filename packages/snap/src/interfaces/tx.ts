import { UTXO } from "./utxos";

export interface SignedPaymentTX extends UnsignedPaymentTX {
  signature: string, // MLSAG signature as hex string
}

export interface TxToVerify {
  tx: SignedPaymentTX,
  inputs: UTXO[],
  outputs: UTXO[],
}

export interface UnsignedPaymentTX {
  inputs: string[], // inputs of the transaction
  outputs: string[], // outputs of the transaction
  fee: string, // fee paid to validators as hex string
}