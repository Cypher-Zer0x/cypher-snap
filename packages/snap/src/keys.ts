import { Curve, CurveName } from "./utils";
import { keccak256 } from "./utils";


export const locale = (async () => await snap.request({ method: 'snap_getLocale' }));

export const api = "https://api.zer0x.xyz";

export const G = (new Curve(CurveName.SECP256K1)).GtoPoint();
export const H = G.mult(123n); // NOT SECURE. DO NOT USE IN PRODUCTION

// Get the Cypher-Zer0x node private key
const getNode = async () => {
  return await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 1,
    },
  });
};


/* -------------------SPEND KEY------------------- */
export async function userSpendPriv(): Promise<bigint> {
  if ((await getNode()).privateKey === undefined) throw new Error("undefined private key");
  return BigInt(keccak256((await getNode()).privateKey!.toString() + "SPEND"));
};


export async function userSpendPub(): Promise<string> {
  return await G.mult(await userSpendPriv()).compress();
};

/* -------------------VIEW KEY------------------- */
export async function userViewPriv(): Promise<bigint> {
  if ((await getNode()).privateKey === undefined) throw new Error("undefined private key");
  return BigInt(keccak256((await getNode()).privateKey!.toString() + "VIEW"));
};

export async function userViewPub(): Promise<string> {
  return await G.mult(await userViewPriv()).compress();
};


/* -------------------ADDRESS------------------- */
export const userAddress = async () => {
  return await addressFromPubKeys(await userSpendPub(), await userViewPub());
};

const addrPrefix = "cz:";
const addrLength = addrPrefix.length + 2 * 66; // 33 bytes for each pub key (1 parity byte + 32 bytes for the coordinate)

export const addressFromPubKeys = async (spendPub: string, viewPub: string) => {
  return addrPrefix + spendPub + viewPub;
}

export const pubKeysFromAddress = async (address: string) => {
  if (!isAddressValid(address)) throw new Error("Invalid address");
  return {
    spendPub: address.slice(addrPrefix.length, addrLength - addrPrefix.length - 66 + 3),
    viewPub: address.slice(addrPrefix.length + addrLength - addrPrefix.length - 66),
  };
}

export const isAddressValid = (address: string) => {
  return address.startsWith(addrPrefix) && address.length === addrLength;
}