import { CoinbaseUTXO, PaymentUTXO } from "../interfaces";
import { isCoinbaseUTXO, isPaymentUTXO } from ".";
import { Point, keccak256, Curve, CurveName } from "../utils";

const G = (new Curve(CurveName.SECP256K1)).GtoPoint();

// pick the utxos owned by the specified user from the utxo set (only returns spendable utxos -> (CoinbaseUTXO | PaymentUTXO))
export async function selectUtxos(
  utxos: (CoinbaseUTXO | PaymentUTXO)[],
  keys: { spendPub: string, viewPriv: bigint }
): Promise<(CoinbaseUTXO | PaymentUTXO)[]> {

  let selected: (CoinbaseUTXO | PaymentUTXO)[] = [];

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
      selected.push(utxo);
    }
  }

  return selected;
}

