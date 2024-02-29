import {
  ButtonType,
  ManageStateOperation,
  address,
  button,
  copyable,
  divider,
  form,
  heading,
  input,
  panel,
  row,
  text,
} from '@metamask/snaps-sdk';
import { userAddress } from "../keys";

/**
 * Initiate a new interface with the starting screen.
 *
 * @returns The Snap interface ID.
 */
export async function createInterface(): Promise<string> {
  return await snap.request({
    method: 'snap_createInterface',
    params: await homeUi(),
  });
}

export async function homeUi() {
  return {
    ui: panel([
      heading('**should display eth balance**'),
      copyable(await userAddress()),
      button({ value: 'Send', name: 'send' }),

      // todo: display token balances for each token in state
      row('USDC', text("123")),
      row('WBTC', text("456")),
      button({ value: 'Update UI', name: 'update' }),
    ]),
  }
}

/**
 * Update a Snap interface to display the transaction type after fetching
 * the transaction from state.
 *
 * @param id -  The interface ID to update.
 */
export async function displayTransactionType(id: string) {

  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: panel([
        button({ value: 'Home', name: 'go-home', variant: 'secondary'}),
      ]),
    },
  });
}

/**
 * Update the interface with a simple form containing an input and a submit button.
 *
 * @param id - The Snap interface ID to update.
 */
export async function newTx(id: string) {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: panel([
        heading('Send tokens'),
        form({
          name: "newTxForm",
          children: [
            input({ name: 'tx-receiver', label: 'Receiver Address' }),
            input({ name: 'amount', label: 'Amount', inputType: "number"}),
            input({ name: 'fee', label: 'Fee (ETH)', inputType: "number", value: "0.00001"}),
            button('Send', ButtonType.Submit, 'submit-tx'),
          ],
        }),
        divider(),
        row(" ", text(" ")),
        button({ value: 'Home', name: 'go-home', variant: 'secondary'}),
      ]),
    },
  });
}

/**
 * Update a Snap interface to show a given value.
 *
 * @param id - The Snap interface ID to update.
 * @param value - The value to display in the UI.
 */
export async function showResult(id: string, value: string) {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: panel([
        heading('Interactive UI Example Snap'),
        text('The submitted value is:'),
        copyable(value),
      ]),
    },
  });
}