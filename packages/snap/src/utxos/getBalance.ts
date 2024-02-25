import { UTXO } from "src/interfaces";
import { isCoinbaseUTXO, isPaymentUTXO } from ".";
import { Point } from "@cypherlab/types-ring-signature";
import { keccak256 } from "@cypherlab/types-ring-signature/dist/src/utils";
import { unmaskAmount } from "./amountMask";
import { G, cypherSpendPriv } from "../keys";

/**
 * Compute the balance from an utxo list (only take into account the utxos owned by keys)
 * 
 * @param utxos - the utxo set
 * @param keys - the keys to check the balance
 * @returns the balance for each currency
 */
export async function getBalance(
  utxos: UTXO[],
  keys: { spendPub: string, viewPriv: bigint }
): Promise<{ [currency: string]: { utxos: UTXO[], balance: bigint } }> {

  const available: { [currency: string]: { utxos: UTXO[], balance: bigint } } = {};

  for (const utxo of utxos) {
    // switch depending on the utxo type ( PaymentUTXO | CoinbaseUTXO | ExitUTXO)

    if ((isCoinbaseUTXO(utxo) || isPaymentUTXO(utxo)) &&
      Point.decompress(keys.spendPub).equals(
        Point.decompress(utxo.public_key)
          .add(
            G.mult(BigInt(keccak256(Point.decompress(utxo.rG).mult(keys.viewPriv).compress())))
              .negate()
          )
      )) {

      if (available[utxo.currency] === undefined) {
        available[utxo.currency] = { utxos: [], balance: 0n};
      }


      available[utxo.currency]!.utxos.push(utxo);

      const clearAmount = unmaskAmount(await cypherSpendPriv, Point.decompress(utxo.rG), utxo.amount)
      console.log("clear amount: ", clearAmount);

      available[utxo.currency]!.balance += clearAmount;
    }
  }

  return available;
}