const bulletproofs = require('bulletproof-js');
const EC = require('elliptic').ec;
import * as cryptoutils from 'bigint-crypto-utils';

export interface LightRangeProof {
  V: string,
  A: string,
  S: string,
  T1: string,
  T2: string,
  tx: string,
  txbf: string,
  e: string,
  a0: string,
  b0: string,
  ind: {L: string, R: string}[],
}

export interface RangeProof extends LightRangeProof {
  G: string,
  order: string,
}
const ProofFactory = bulletproofs.ProofFactory;
const ProofUtils = bulletproofs.ProofUtils;
const constants = bulletproofs.Constants;
const secp256k1 = constants.secp256k1;
const ec = new EC('secp256k1');

// Generator
const G = ec.g;
// Orthogonal Generator
const H = ec.keyFromPublic('0450929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac031d3c6863973926e049e637cb1b5f40a36dac28af1766968c30c2313f3a38904', 'hex').pub;

export function getRangeProof(amount: bigint): LightRangeProof {
  // Lower and upper bound of range proof (this will be treated as exponents of 2)
  const low = 0n;
  const upper = 64n;

  if (amount < low || amount > 2n ** upper) {
    throw new Error('Amount out of range');
  }

  // Random blinding factor
  const x = cryptoutils.randBetween(secp256k1.n);

  // Pedersen Commitment to our amount
  const V = ProofUtils.getPedersenCommitment(amount, x, secp256k1.n, H);

  // Compute an uncompressed proof first. Note the last parameter will switch off asserts improving performance
  const uncompr_proof = ProofFactory.computeBulletproof(amount, x, V, G, H, low, upper, secp256k1.n, false);
  // Compress proof using the inner product protocol (Again pass false to switch off asserts)
  const compr_proof = uncompr_proof.compressProof(false);

  const json = JSON.parse(compr_proof.toJson(true));

  // remove return json without G and order keys
  delete json.G;
  delete json.order;

  return {
    ...json    
  } satisfies LightRangeProof;
}

export function verifyRangeProof(proof: LightRangeProof): boolean {
  try {
    const CompressedProofs = bulletproofs.CompressedProofs;
    return CompressedProofs.fromJsonString(JSON.stringify({
      ...proof,
      G: "0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
      order: "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"
    } satisfies RangeProof)).verify(0n, 64n);


  } catch (e) {
    console.error(`Unable to verify range proof: ${e}`);
    return false;
  }
}

// const rangeProof = getRangeProof(25003n);

// console.log(verifyRangeProof(rangeProof));



// // Amount to which we commit
// const a = BigInt("0x10000000000000000") - 1n; // 25003n;

// // Random blinding factor
// const x = cryptoutils.randBetween(secp256k1.n);

// // Lower and upper bound of range proof (this will be treated as exponents of 2)
// const low = 0n;
// const upper = 64n;

// // Pedersen Commitment to our amount
// const V = ProofUtils.getPedersenCommitment(a, x, secp256k1.n, H);

// // Compute an uncompressed proof first. Note the last parameter will switch off asserts improving performance
// const uncompr_proof = ProofFactory.computeBulletproof(a, x, V, G, H, low, upper, secp256k1.n, false);
// // Compress proof using the inner product protocol (Again pass false to switch off asserts)
// const compr_proof = uncompr_proof.compressProof(false);

// // Proofs can be serialized and deserialized to and from JSON.
// console.log(compr_proof.toJson(true));
// // Verify a proof calling the verify function on the proof object (works on both uncompressed and compressed version)
// console.log(compr_proof.verify(low, upper) ? 'Valid proof' : 'Invalid Proof');
