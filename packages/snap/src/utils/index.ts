export { Curve, CurveName } from './point';
export { Point } from './point';
export { maskAmount, unmaskAmount } from "./amountMask";
export { generateRing } from "./generateRing";
import { keccak_256 } from "@noble/hashes/sha3";

export function keccak256(
  input: string | bigint[],
): string {
  if (typeof input === "string") {
    return "0x" + uint8ArrayToHex(keccak_256(input));
  }
  return (
    "0x" + uint8ArrayToHex(keccak_256(input.map((x) => x.toString()).join("")))
  );
}
function uint8ArrayToHex(array: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < array.length; i++) {
    hex += ("00" + array[i]!.toString(16)).slice(-2);
  }
  return hex;
}
/**
 * Convert the smallest unit to readable value of a token
 * 
 * @param amount - The amount in the smallest unit
 * @param decimals - The number of decimals of the token
 * 
 * @returns - The human readable value
 */
export function amountToString(amount: bigint, decimals: number): string {

  const strAmount = amount.toString();

  if (strAmount.length <= decimals) {
    return `0.${strAmount.padStart(decimals, '0')}`.replace(/\.?0+$/, "");
  }

  const xrp = strAmount.slice(0, strAmount.length - decimals);
  const xrpDecimal = strAmount.slice(strAmount.length - decimals);

  // concat and remove all trailing zeros
  return `${xrp}.${xrpDecimal}`.replace(/\.?0+$/, "");
}

