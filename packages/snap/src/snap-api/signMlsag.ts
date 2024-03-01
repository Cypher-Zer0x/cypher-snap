import { keccak256 } from '../utils';
import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';
import { Mlsag } from '../interfaces';
import { amountToString, Point, Curve, CurveName } from '../utils';
import { G } from '../keys';

/**
 * Sign a message using the MLSAG ring signature scheme 
 * (MLSAG: Multilayered Linkable Spontaneous Anonymous Group signature)
 * 
 * @param message - The message to sign
 * @param keys - The private keys of the UTXOs and the commitment key
 * @param ring - The ring of public keys
 * 
 * @returns the mlsag signature as hex string
 */
export async function signMlsag(message: string, privKeys: bigint[], ring: Point[][], alreadyApproved = false): Promise<string> {

  if (!alreadyApproved) {
    const confirmation = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading('MLSAG Request'),
          text('You are about to sign a message with MLSAG. Please review the details and confirm.'),
          divider(),
          text('You are signing: '),
          copyable(message),
          text(`You own ${privKeys.length} of the ${ring.flat(2).length + privKeys.length} keys in the ring.`),
          text('Ring:'),
          copyable(ring.map((elem: Point[]) => elem.map((point: Point) => point.compress()).join(',\n\t')).join(',\n\t')),
        ])
      },
    });

    if ((confirmation as boolean) !== true) {
      throw new Error('User cancelled the MLSAG signature request');
    }
  }

  return hexEncodeMLSAG(await sign(message, privKeys, ring));
}

export function verifyMlsag(signature: { ring: Point[][], c: bigint, responses: bigint[][], message: string, keyImages: Point[] }) {
  const curve = new Curve(CurveName.SECP256K1);
  const G = curve.GtoPoint();

  for (let i = 0; i < signature.ring.length; i++) {
    if (signature.ring[i]!.length !== signature.ring[0]!.length) throw new Error("Invalid length of ring elements");
  }

  let c = signature.c;
  for (let i = 1; i < signature.ring.length; i++) {
    c = BigInt(keccak256(
      signature.message +
      signature.ring[0]!.map((pubKeys, index) => G.mult(signature.responses[i - 1]![index]!).add(signature.ring[i - 1]![index]!.mult(c)).compress()).join("") +
      signature.keyImages.map((keyImage, index) => hashToSECP256K1(signature.ring[i - 1]![index]!.compress()).mult(signature.responses[i - 1]![index]!).add(signature.keyImages[index]!.mult(c)).compress()).join("")
    ));
  }

  c = BigInt(keccak256(
    signature.message +
    signature.ring[0]!.map((pubKeys, index) => G.mult(signature.responses[signature.ring.length - 1]![index]!).add(signature.ring[signature.ring.length - 1]![index]!.mult(c)).compress()).join("") +
    signature.keyImages.map((keyImage, index) => hashToSECP256K1(signature.ring[signature.ring.length - 1]![index]!.compress()).mult(signature.responses[signature.ring.length - 1]![index]!).add(signature.keyImages[index]!.mult(c)).compress()).join("")
  ));

  return signature.c === c;
}



/**
 * Sign a message using the MLSAG ring signature scheme 
 * (MLSAG: Multilayered Linkable Spontaneous Anonymous Group signature)
 * 
 * @param message - The message to sign
 * @param keys - The private keys of the UTXOs and the commitment key
 * @param ring - The ring of public keys
 */
export async function signRingCtTX(
  message: string,
  keys: { utxoPrivKeys: bigint[], commitmentKey: bigint },
  ring: Point[][],
  txContent: { utxoData: { [recipient: string]: { currency: string, value: bigint, decimals: number } }, fee: bigint },
  alreadyApproved = false,
): Promise<string> {

  const recipientList =
    Object.entries(txContent.utxoData).map(
      ([recipient, { currency, value, decimals }]) => copyable(`${recipient} -> ${amountToString(value, decimals)} ${currency}`)
    );
  if (!alreadyApproved) {
    let confirmation = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading('MLSAG Request'),
          text('You are about to sign a message with MLSAG. Please review the details and confirm.'),
          divider(),
          text('**Transaction details:**'),
          text('Recipients:'),
          ...recipientList,
          text('Fee:'),
          copyable(`${amountToString(txContent.fee, 18)} ETH`),
          text(`**!!! Please note that these are one-time addresses and any future funds sent to this addresses won't be accessible !!!**`), // todo: check if these addresses have already been used
          divider(),
          text(`You own ${keys.utxoPrivKeys.length + 1} of the ${ring.flat(2).length + keys.utxoPrivKeys.length + 1} keys in the ring.`),
          text('Ring:'),
          copyable(ring.map((elem: Point[]) => elem.map((point: Point) => point.compress()).join(',\n\t')).join(',\n\t')),
        ])
      },
    });

    if ((confirmation as boolean) !== true) {
      throw new Error('User cancelled the MLSAG signature request');
    }
  }

  const commitmentPubKey = G.mult(keys.commitmentKey);
  // add the commitment key to each ring element
  ring = ring.map(ringElem => [commitmentPubKey, ...ringElem]) as Point[][];

  return await signMlsag(message, [keys.commitmentKey, ...keys.utxoPrivKeys], ring, true);
}



function sign(message: string, allPrivKeys: bigint[], ring: Point[][]): Mlsag {
  const curve = new Curve(CurveName.SECP256K1);
  const G2 = curve.GtoPoint();
  const P = curve.P;

  const allPubKeys: Point[] = allPrivKeys.map(privKey => G2.mult(privKey));

  // Get the key images
  const keyImages: Point[] = allPrivKeys.map((privKey, index) => hashToSECP256K1(allPubKeys[index]!.compress()).mult(privKey));

  const signerIndex = 0; // TODO: NOT SECURE

  ring = ring // TODO: insert the signer's public key at index 0 of the ring and then order the rieng elements 
    // to avoid reliying on random number generation for the signerIndex
    .slice(0, signerIndex)
    .concat([allPubKeys], ring.slice(signerIndex));


  // generate random responses
  let responses: bigint[][] = ring.map(ringElem => ringElem.map(() => randomBigint(P)));

  const alpha = responses[0]!.map((response) => response + 1n);

  const ceePiPlusOne = BigInt(keccak256(
    message +
    ring[0]!.map((_, index) => G2.mult(alpha[index]!).compress()).join("") +
    keyImages.map((_, index) => hashToSECP256K1(allPubKeys[index]!.compress()).mult(alpha[index]!).compress()).join("")
  ));

  const cees: bigint[] = ring.map(() => 0n);

  for (let i = signerIndex + 1; i < ring.length + signerIndex + 1; i++) {
    /* 
    Convert i to obtain a numbers between 0 and ring.length - 1, 
    starting at pi + 1, going to ring.length and then going from 0 to pi (included)
    */
    const index = i % ring.length;
    const indexMinusOne =
      index - 1 >= 0n ? index - 1 : index - 1 + ring.length;

    if (index === (signerIndex + 1) % ring.length) {
      cees[index] = ceePiPlusOne;
    } else {
      // compute the c value
      cees[index] = BigInt(keccak256(
        message +
        ring[0]!.map((_, index) => G2.mult(responses[indexMinusOne]![index]!).add(ring[indexMinusOne]![index]!.mult(cees[indexMinusOne]!)).compress()).join('') +
        keyImages.map((_, index) => hashToSECP256K1(ring[indexMinusOne]![index]!.compress()).mult(responses[indexMinusOne]![index]!).add(keyImages[index]!.mult(cees[indexMinusOne]!)).compress()).join('')
      ));
    }
  }

  responses[signerIndex] = responses[signerIndex]!.map((r, index) => piSignature(alpha[index]!, cees[signerIndex]!, allPrivKeys[index]!, new Curve(CurveName.SECP256K1)));

  return {
    message: message,
    ring: ring,
    c: cees[0]!,
    responses: responses,
    keyImages: keyImages // todo: return { commitmentPubKey: Point, witnesses: Point[] } instead of utxoKeyImages and when verifying, add the key image at index 0 for each ring element -> save (ring size - 1) * compressed_point_size bytes
  } satisfies Mlsag;
}

/**
 * Has a string to a point on the SECP256K1 curve
 *  !!!!! NOT SECURE, DO NOT USE IN PRODUCTION !!!!!
 * 
 * @param data - The data to hash
 * @returns The point on the SECP256K1 curve
 */
export function hashToSECP256K1(data: string): Point {
  console.warn("!!! hashToSECP256K1 is not secure, do not use in production !!!");
  const curve = new Curve(CurveName.SECP256K1);
  const point = curve.GtoPoint();
  return point.mult(BigInt(keccak256(data)));
}


// encodes the signature to a hex string
export function hexEncodeMLSAG(signature: Mlsag) {
  const str = JSON.stringify({
    ring: signature.ring.map(ringElem => ringElem.map(point => point.compress())),
    c: signature.c.toString(),
    responses: signature.responses.map(responseElem => responseElem.map(response => response.toString())),
    message: signature.message,
    keyImages: signature.keyImages.map(point => point.compress())
  });

  return `0x${Buffer.from(str).toString('hex')}`;
}

export function hexDecodeMLSAG(hex: string): Mlsag {
  const obj = JSON.parse(Buffer.from(hex.slice(2), 'hex').toString('utf-8'));

  return {
    ring: obj.ring.map((ringElem: string[]) => ringElem.map((point: string) => Point.decompress(point))),
    c: BigInt(obj.c),
    responses: obj.responses.map((responseElem: string[]) => responseElem.map((response: string) => BigInt(response))),
    message: obj.message,
    keyImages: obj.keyImages.map((point: string) => Point.decompress(point))
  };
}


/**
 * Compute the signature from the actual signer
 *
 * @remarks
 * This function is used to compute the signature of the actual signer in a ring signature scheme.
 *
 * @param alpha - the alpha value
 * @param c - the seed
 * @param signerPrivKey - the private key of the signer
 * @param Curve - the curve to use
 *
 * @returns the signer response as a point on the curve
 */
export function piSignature(
  alpha: bigint,
  c: bigint,
  signerPrivKey: bigint,
  curve: Curve,
): bigint {
  if (
    alpha === BigInt(0) ||
    c === BigInt(0) ||
    signerPrivKey === BigInt(0) ||
    curve.N === BigInt(0)
  )
    throw new Error("Invalid input");
  return modulo(alpha - c * signerPrivKey, curve.N);
}

function modulo(n: bigint, p: bigint): bigint {
  const result = n % p;
  return result >= 0n ? result : result + p;
}

//eslint-disable-next-line @typescript-eslint/no-var-requires
const randomBytes = require("crypto-browserify").randomBytes;

/**
 * generate a random bigint in [1,max[
 *
 * @param max the max value of the random number
 * @returns the random bigint
 */

export function randomBigint(max: bigint): bigint {
  if (max <= 0n) {
    throw new Error("max must be greater than 0");
  }

  // +1 to ensure we can reach max value
  const byteSize = (max.toString(16).length + 1) >> 1;

  //we use a while loop as a safeguard against the case where the random number is greater than the max value
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const array = randomBytes(byteSize);
    const randomHex = array.toString("hex");
    const randomBig = BigInt("0x" + randomHex);

    if (randomBig < max) {
      return randomBig;
    }
  }
}
