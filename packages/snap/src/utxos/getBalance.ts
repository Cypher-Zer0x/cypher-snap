import { CoinbaseUTXO, PaymentUTXO, UTXO } from "../interfaces";
import { isCoinbaseUTXO, isPaymentUTXO } from ".";
import { Curve, CurveName, keccak256, Point } from "../utils";
import { unmaskAmount } from "../utils/amountMask";
// import { cypherSpendPriv } from "../keys";
import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';


const G = (new Curve(CurveName.SECP256K1)).GtoPoint();

const userViewPriv = 999999999999999999999999999999999n;
const userSpendPriv = 8888888888888888888888888888888888n;


/**
 * Compute the balance from an utxo list (only take into account the utxos owned by keys)
 * 
 * @param utxos - the utxo set
 * @param keys - the keys to check the balance
 * @returns the balance for each currency
 */
export async function getBalance(
  utxos: (CoinbaseUTXO | PaymentUTXO)[],
  keys: { spendPub: string, viewPriv: bigint }
): Promise<{ [currency: string]: { utxos: UTXO[], balance: string } }> {

  const available: { [currency: string]: { utxos: UTXO[], balance: string } } = {};

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
        available[utxo.currency] = { utxos: [], balance: "0"};
      }


      available[utxo.currency]!.utxos.push(utxo);

      const clearAmount = unmaskAmount(userViewPriv, utxo.rG, utxo.amount);

      available[utxo.currency]!.balance += clearAmount;
    }
  }

  //  let confirmation = await snap.request({ // for debug purposes
  //   method: 'snap_dialog',
  //   params: {
  //     type: 'confirmation',
  //     content: panel([
  //       heading('MLSAG Request'),
  //       text('You are about to sign a message with MLSAG. Please review the details and confirm.'),
  //       divider(),
  //       text('utxos avant:'),
  //       copyable(JSON.stringify(available)),
  //     ])
  //   },
  // });

  return available;
}