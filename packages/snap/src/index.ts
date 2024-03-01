import { createAndBroadcastTx } from './txs/ringCt/createAndBroadcastTx';
import { G, addressFromPubKeys, api } from "./keys";



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
    case 'hello':

      const data = [
        {
          address: await addressFromPubKeys(G.mult(12n).compress(), G.mult(11n).compress()),
          value: 100n
        }
      ];

      const fee = 10n;

      // // return await createAndBroadcastTx(api, data, fee)
      // // return JSON.stringify(await getUtxos(api));
      // console.log('Retrieving new UTXOs...')
      // const utxos = await getUtxos("https://api.zer0x.xyz")
      // console.log("FETCHING UTXOS", utxos);
      // // save the balance to the local storage
      // await saveUtxos(utxos as (PaymentUTXO | CoinbaseUTXO)[]);

      // console.log('Utxos retrieved and saved to local storage:\n', await getLocalUtxos());
      return await createAndBroadcastTx(api, data, fee);

    default:
      throw new Error('Method not found.');
  }
};







import type {
  OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { getUtxos } from './node-api/getUtxos';
import { getLocalUtxos, resetState, saveUtxos } from './utils/utxoDB';
import { CoinbaseUTXO, PaymentUTXO } from './interfaces';



export { onHomePage } from './onEvents/onHomePage';
export { onUserInput } from './onEvents/onUserInput';
export { onCronjob } from './onEvents/onCronjob';