


import { Curve, CurveName, Point, getRandomSecuredNumber, piSignature, randomBigint } from '@cypherlab/types-ring-signature';
import { keccak256 } from '@cypherlab/types-ring-signature/dist/src/utils';
import { panel, text, heading } from '@metamask/snaps-ui';
import { Mlsag } from '../interfaces';
import { G } from '../keys';
import { amountToString } from '../utils';
import { hashToSECP256K1 } from '../utxos/mlsag';
import { signMlsag } from '../utxos';

/**
 * Sign a message using the MLSAG ring signature scheme 
 * (MLSAG: Multilayered Linkable Spontaneous Anonymous Group signature)
 * 
 * @param message - The message to sign
 * @param keys - The private keys of the UTXOs and the commitment key
 * @param ring - The ring of public keys
 */
export async function signTX(
  message: string,
  keys: { utxoPrivKeys: bigint[], commitmentKey: bigint },
  ring: Point[][],
  txContent: { utxoData: { [recipient: string]: { currency: string, value: bigint, decimals: number } }, fee: bigint }
): Promise<Mlsag> {

  const txDetails =
    Object.entries(txContent.utxoData).map(
      ([recipient, { currency, value, decimals }]) => `Recipient: ${recipient}, Currency: ${currency}, Value: ${amountToString(value, decimals)}`)
      .join('\n') +
    `\nFee: ${amountToString(txContent.fee, 18)} ETH`;


  let confirmation = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        heading('Transaction Confirmation'),
        text(`You are about to sign a transaction. Please review the details and confirm.

Transaction details:
${txDetails}

!!! Please note that this is a one-time address and any future funds sent to this address won't be accessible !!!

More informations about what you are going to sign:
Message: ${message}

UTXOs public keys: ${keys.utxoPrivKeys.map((priv: bigint) => G.mult(priv).compress()).join(',\n\t')}

Ring: ${ring.map((elem: Point[]) => elem.map((point: Point) => point.compress()).join(',\n\t')).join(',\n\t')}

You own ${keys.utxoPrivKeys.length} of the ${ring.flat(2).length + keys.utxoPrivKeys.length} keys in the ring.

    `),
      ]),
    },
  });

  if((confirmation as boolean) !== true) {
    throw new Error('User cancelled the MLSAG signature request');
  }

  return signMlsag(message, keys, ring);
}