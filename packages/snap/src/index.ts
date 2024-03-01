import type {
  OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { G, userAddress, userSpendPub, userViewPub } from "./keys";
import { randomBigint } from './snap-api/signMlsag';
import { Curve, CurveName, Point, keccak256 } from './utils';

export { onHomePage } from './onEvents/onHomePage';
export { onUserInput } from './onEvents/onUserInput';
export { onCronjob } from './onEvents/onCronjob';
export { onInstall } from './onEvents/onInstall';

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
    case "zer0x-address":
      return await userAddress();

    case "zer0x-deposit-payload":
      const P = (new Curve(CurveName.SECP256K1)).P;
      const r = randomBigint(P);
      const pub =
        G.mult(BigInt(keccak256(Point.decompress(await userViewPub()).mult(r).compress()))).add(Point.decompress(await userSpendPub())); 

      return {
        pubkey: pub.compress(),
        rG: G.mult(r).compress(),
      }

    default:
      throw new Error('Method not found.');
  }
};







