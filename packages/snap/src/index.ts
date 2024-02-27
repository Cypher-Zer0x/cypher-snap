import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Curve, CurveName } from "./utils";
import { signMlsag, signRingCtTX } from './snap-api';
import { setupRingCt } from './txs/ringCt/setupRingCt';
import { endAndBroadcastTx } from './txs/ringCt/endAndBroadcastTx';

const G = (new Curve(CurveName.SECP256K1)).GtoPoint();


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
    case 'hello1': // cypher_snap_mlsag_request
      // if (!request.params) {
      //   throw new Error('Invalid request parameters');
      // }
      const message = "request.params";
      const ring = [ // should be generated from the UTXO set by the wallet itself
        [
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(12n),
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(13n)
        ],
        [
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(14n),
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(15n)
        ],
        [
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(16n),
          (new Curve(CurveName.SECP256K1)).GtoPoint().mult(17n)
        ]
      ];

      const privKeys = [123456888n, 99899898n];

      const recipientViewPriv = 177777777777777777n; // todo: remove for prod
      const recipientSpendPriv = 277777777777777778n; // todo: remove for prod


      const outputs = [
        {
          recipientViewPub: G.mult(recipientViewPriv).compress(), // todo: get from request args
          recipientSpendPub: G.mult(recipientSpendPriv).compress(), // todo: get from request args
          value: 10n
        }
      ];

      return await signMlsag(message, privKeys, ring);

    case 'hello':

      const data = [
        {
          recipientViewPub: G.mult(11n).compress(),
          recipientSpendPub: G.mult(12n).compress(),
          value: 100n
        }
      ];

    const fee = 10n;
      return await endAndBroadcastTx(data, fee)

    default:
      throw new Error('Method not found.');
  }
};


