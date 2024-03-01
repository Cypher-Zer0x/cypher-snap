
/**
 * Convert drops to readable XRP value
 * 
 * @param drops - drops amount to convert
 * 
 * @returns - XRP human readable value
 */
export function stringFromAmount(amount: BigInt, decimals: number): string {

  const str = amount.toString();

  if (str.length <= decimals) {
    console.log("RR");
    console.log(decimals - str.length);
    return `0.${str.padStart(decimals, '0')}`.replace(/\.?0+$/, "");
  }
  const int = str.slice(0, str.length - decimals);
  const decimal = str.slice(str.length - decimals);

  // concat and remove all trailing zeros
  return `${int}.${decimal}`.replace(/\.?0+$/, "");
}



// const amount = 10000000000000000n,
//   decimals = 18;

// console.log(stringFromAmount(amount, decimals)); // 0.01