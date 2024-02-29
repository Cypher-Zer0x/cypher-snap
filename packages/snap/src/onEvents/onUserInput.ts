import { Component, OnUserInputHandler, UserInputEventType, panel, row, text, button, heading, input } from "@metamask/snaps-sdk";
import { displayTransactionType, showResult, homeUi, newTx } from "./ui";
import { createAndBroadcastTx } from "../txs/ringCt/createAndBroadcastTx";
import { api, isAddressValid } from "../keys";
import { amountFromString } from "../utils/convert-types/stringToAmount";

/**
 * Handle incoming user events coming from the MetaMask clients open interfaces.
 *
 * @param params - The event parameters.
 * @param params.id - The Snap interface ID where the event was fired.
 * @param params.event - The event object containing the event type, name and value.
 * @see https://docs.metamask.io/snaps/reference/exports/#onuserinput
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  if (event.type === UserInputEventType.ButtonClickEvent) {
    switch (event.name) {
      case 'update':
        await newTx(id);
        break;

      case 'transaction-type':
        await displayTransactionType(id);
        break;

      case 'go-home':
        await snap.request({
          method: 'snap_updateInterface',
          params: {
            id,
            ui: (await homeUi()).ui
          },
        });
        break;

      case 'send':
        await newTx(id);
        break;

      default:
        break;
    }
  }

  if (event.type === UserInputEventType.FormSubmitEvent) {

    switch (event.name) {
      case "newTxForm":
        // console.log("event: ", event.name, event.name.length, event.name );
        // console.log("event: ", JSON.stringify(event.value));
        if (!checkSendTxParams(event)) throw new Error("Invalid parameters");
        console.log("check passed");
        const data = [{address: event.value['tx-receiver']!, value: amountFromString(event.value['amount']!, 18)}]

        const fee = event.value['fee'];
        await createAndBroadcastTx(api, data, amountFromString(event.value['fee']!, 18));
        break;

      default:
        break;
    }
  }
  console.log("event: ", event);
};

// check if the event contains all the required parameters
function checkSendTxParams(event: any): boolean {
  console.log("event: ", event.value);
  if (!event.value['tx-receiver'] || !event.value['amount'] || !event.value['fee']) {
    console.log("0");
    return false;
  }

  try {
    amountFromString(event.value['amount'], 18);
    amountFromString(event.value['fee'], 18);
  } catch (e) {
    console.log("1");
    return false;
  }

  if (amountFromString(event.value['amount'], 18) <= 0 || amountFromString(event.value['fee'], 18) <= 0){
    console.log("2");
    return false;
  }

  // check if the tx-receiver is a valid zer0x address
  if (!isAddressValid(event.value['tx-receiver'])) {
    console.log("3");
    return false;
  }

  return true;
}