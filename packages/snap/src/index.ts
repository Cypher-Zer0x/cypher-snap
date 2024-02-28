// import { Component, OnTransactionHandler, OnUserInputHandler, Transaction, UserInputEventType } from '@metamask/snaps-sdk';
import { Curve, CurveName } from "./utils";
import { signMlsag } from './snap-api';
import { endAndBroadcastTx } from './txs/ringCt/endAndBroadcastTx';
import {
  ButtonType,
  ManageStateOperation,
  address,
  button,
  copyable,
  form,
  heading,
  input,
  panel,
  row,
  text,
  assert,
} from '@metamask/snaps-sdk';
import { getUtxos } from './node-api/getUtxos';

const G = (new Curve(CurveName.SECP256K1)).GtoPoint();
const api = "https://api.zer0x.xyz";

import type { OnHomePageHandler, OnRpcRequestHandler } from '@metamask/snaps-sdk';

export const onHomePage: OnHomePageHandler = async () => {
  /* 
  display :
  - eth balance
  - display address (copyable)
  - token balance
  - send button (eth and tokens)
  - view utxos
  - view tx history
  */
  return {
    content: panel([
      heading('Hello world!'),
      text('Welcome to my Snap home page!'),
      // button('Display address', ButtonType.Button, 'Display address'),
      // form({
      //   name: 'example-form',
      //   children: [
      //     input({
      //       name: 'example-input',
      //       placeholder: 'Enter something...',
      //     }),
      //     button('Submit', ButtonType.Submit, 'submit'),
      //   ],
      // }),
    ]),
  };
};

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
      return await endAndBroadcastTx(api, data, fee)
    // return JSON.stringify(await getUtxos(api));

    default:
      throw new Error('Method not found.');
  }
};
