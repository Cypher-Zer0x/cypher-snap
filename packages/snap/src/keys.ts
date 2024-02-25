import { Curve, CurveName } from "@cypherlab/types-ring-signature";
import { keccak256 } from "@cypherlab/types-ring-signature/dist/src/utils";

export const G = (new Curve(CurveName.SECP256K1)).GtoPoint();

// Get the Cypher-Zer0x node private key
const cypherZer0xNode = await (async () => {
  return await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 1,
    },
  });
})();

// console.log(cypherZer0xNode);

/* -------------------SPEND KEY------------------- */
export const cypherSpendPriv = (async () => {
  if (cypherZer0xNode.privateKey === undefined) throw new Error("undefiuned private key");
  return BigInt(keccak256(cypherZer0xNode.privateKey.toString() + "SPEND"));
})();

export const deriveCypherZer0xSpendPubKey = (async () => {
  await G.mult(await cypherSpendPriv).compress();
})();

/* -------------------VIEW KEY------------------- */
const cypherViewPriv = (async () => {
  if (cypherZer0xNode.privateKey === undefined) throw new Error("undefiuned private key");
  return BigInt(keccak256(cypherZer0xNode.privateKey.toString() + "VIEW"));
})();

export const deriveCypherZer0xViewPubKey = (async () => {
  await G.mult(await cypherViewPriv).compress();
})();
