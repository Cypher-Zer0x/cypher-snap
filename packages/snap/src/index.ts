import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { panel, text } from '@metamask/snaps-sdk';
import { signMlsag } from './snap-api';
import { Curve, CurveName } from '@cypherlab/types-ring-signature';
import { hexEncodeMLSAG } from './utxos/mlsag';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello1':

    return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });
      case 'hello': // doesn't work

      const message = "Hello, world!";
      const ring = [
        [
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(12n),
          // (new Curve(CurveName.SECP256K1)).GtoPoint().mult(13n)
        ],
        [
          // (new Curve(CurveName.SECP256K1)).GtoPoint().mult(14n),
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(15n)
        ],
        [
          // (new Curve(CurveName.SECP256K1)).GtoPoint().mult(16n),
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(17n)
        ]
      ];


      // const sig = signMlsag(message, { utxoPrivKeys: [123456888n], commitmentKey: 99899898n }, ring);
      // console.log("hex sig: ", hexEncodeMLSAG(sig));
      // console.log("verified: ", verifyMlsag(hexDecodeMLSAG(hexEncodeMLSAG(sig))));


      return new Promise( async (resolve) => {
        resolve({
          hexMlsag: hexEncodeMLSAG(await signMlsag(message, [123456888n, 99899898n], ring)),
        });
      });
    default:
      throw new Error('Method not found.');
  }
};