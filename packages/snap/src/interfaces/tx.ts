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


// body expected by the ringct endpoint
export interface TxToRpc {
  inputs: string[], //
  outputs: UTXO[], // UTXOs to be created
  hash: string,      // hash of the UTXO
  signature: string, // signature of the transaction in hex format
}