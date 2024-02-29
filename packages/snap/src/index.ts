// import { Component, OnTransactionHandler, OnUserInputHandler, Transaction, UserInputEventType } from '@metamask/snaps-sdk';
import { Curve, CurveName } from "./utils";
import { signMlsag } from './snap-api';
import { createAndBroadcastTx } from './txs/ringCt/createAndBroadcastTx';
import {
  ButtonType,
  // ManageStateOperation,
  address,
  button,
  copyable,
  form,
  heading,
  input,
  panel,
  row,
  text,
  // assert,
} from '@metamask/snaps-sdk';
import { getUtxos } from './node-api/getUtxos';
import { getBalance } from "./utxos";
import { CoinbaseUTXO, PaymentUTXO } from "./interfaces";
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
    case 'hello1': // cypher_snap_mlsag_request

      const utxos = await getUtxos("https://api.zer0x.xyz");
      const balance = getBalance(utxos as (PaymentUTXO | CoinbaseUTXO)[], { spendPub: G.mult(11111111n).compress(), viewPriv: 12344555n });

      return await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('MLSAG Request'),
            text('You are about to sign a message with MLSAG. Please review the details and confirm.'),
            copyable(JSON.stringify(balance)),
          ])
        },
      });

    case 'hello':

      const data = [
        {
          address: await addressFromPubKeys(G.mult(12n).compress(), G.mult(11n).compress()),
          value: 100n
        }
      ];

      const fee = 10n;
      
      return await createAndBroadcastTx(api, data, fee)
    // return JSON.stringify(await getUtxos(api));

    default:
      throw new Error('Method not found.');
  }
};







import type {
  OnRpcRequestHandler,
} from '@metamask/snaps-sdk';



export { onHomePage } from './onEvents/onHomePage';
export { onUserInput } from './onEvents/onUserInput';
