export * from "./proofs";
export * from "./tx";
export * from "./utxos";

export enum ExitChainId {
  OPTIMISM = "0xa",
}




export interface UtxoStorage {
  [amount: string]: string; // stringified array of UTXOs
}
