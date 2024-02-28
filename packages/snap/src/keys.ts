import { Curve, CurveName } from "./utils";
import { keccak256 } from "./utils";

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
