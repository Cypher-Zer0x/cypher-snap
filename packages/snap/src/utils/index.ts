export{ Curve, CurveName } from '@cypherlab/types-ring-signature';
export { Point } from './point';
export { maskAmount, unmaskAmount } from "./amountMask";
export { keccak256 } from "@cypherlab/types-ring-signature/dist/src/utils/hashFunction";
export { generateRing } from "./generateRing";
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

