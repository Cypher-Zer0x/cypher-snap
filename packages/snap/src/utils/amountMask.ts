import { Point } from ".";
import { keccak256 } from ".";

// mask an amount to insert into an utxo
export function maskAmount(receiverViewPub: Point, senderSpendPriv: bigint, amount: bigint): string {
  // ensure amount can be store on 8 Bytes
  if (amount > 0xFFFFFFFFFFFFFFFFn) {
    throw new Error("Amount is too big");
  }
  if (amount < 0n) {
    return "0".padStart(64, "0");
    // throw new Error("Amount is negative");
  }
  // get the Diffie-Hellman shared secret
  const sharedSecret = keccak256("amount" + keccak256(receiverViewPub.mult(senderSpendPriv).compress()));

  // convert the amount to binary and pad it with 0 to get 64 bits
  const binaryPaddedAmount = amount.toString(2).padStart(64, "0");

  // convert the shared secret to 8 bytes binary string and xor it with the amount
  return (BigInt(sharedSecret) ^ BigInt("0b" + binaryPaddedAmount)).toString(2).padStart(64, "0");
}


// unmask the amount of an utxo you own
export function unmaskAmount(receiverViewPriv: bigint, senderSpendPub: string, maskedAmount: string): bigint {
  const senderPub = Point.decompress(senderSpendPub);
  // ensure maskedAmount is 8 bytes. If not, pad it with 0
  if (maskedAmount.length !== 64) {
    maskedAmount = maskedAmount.padStart(64, "0");
  }
  // get the Diffie-Hellman shared secret
  const sharedSecret = keccak256("amount" + keccak256(senderPub.mult(receiverViewPriv).compress()));

  // convert the shared secret and the amount to binary and xor the 64 first bits
  const binaryAmount = (BigInt(sharedSecret) ^ BigInt("0b" + maskedAmount)).toString(2).padStart(64, "0");

  // convert the binary amount to a base 10 bigint
  return BigInt("0b" + binaryAmount);
}
