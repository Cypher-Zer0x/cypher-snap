import { SignedPaymentTX } from "src/interfaces";

/**
 * Broadcast a transaction to the network
 * 
 * @param tx - The transaction to broadcast
 * 
 * @returns - The transaction hash or an error message
 */
export async function broadcastTx(tx: SignedPaymentTX): Promise<string> {
  return "not implemented";
}