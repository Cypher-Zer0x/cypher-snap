/**
 * Convert an xrp value to drops
 * 
 * @param stringOrNumber - xrp value to convert
 * @param xrpDecimals - The number of decimals
 * 
 * @returns - The corresponding drops value
 */
export function amountFromString(stringOrNumber: Number | string, xrpDecimals: number): bigint {

  const strXrp: string = typeof stringOrNumber === 'string' ? stringOrNumber : stringOrNumber.toString();

  const [integer, decimals] = strXrp.split('.');

  if (!decimals) {
    return BigInt(integer!) * BigInt(10 ** xrpDecimals);
  }

  if (decimals.length > xrpDecimals) {
    throw new Error(`Invalid amount value: ${stringOrNumber} -> too many decimals`);
  }

  const decimalsPadded = decimals.padEnd(xrpDecimals, '0');
  // console.log("original: ", stringOrNumber, "\ninteger: ", integer, "\ndecimals: ", decimals, "\ndecimalsPadded: ", decimalsPadded);
  return BigInt(`${integer}${decimalsPadded}`);
}