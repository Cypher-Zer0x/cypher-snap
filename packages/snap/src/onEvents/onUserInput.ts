import { Component, OnUserInputHandler, UserInputEventType, panel, row, text, button, heading, input } from "@metamask/snaps-sdk";
import { homeUi, newTx, sendTxFromExpended, validTx } from "./ui";
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
  console.log("event nameee: ", event.name, event.type);

  if (event.type === UserInputEventType.ButtonClickEvent) {
    console.log("BUTTONCLICKEVENT: ");
    switch (event.name) {
      case 'update':
        await newTx(id);
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
        console.log("SEND");
        await newTx(id);
        break;

      default:
        break;
    }

    if (event.name?.startsWith('submit-tx+')) {
      console.log('CUSTOM EVENT');
      try {
        const data = JSON.parse(event.name.split('+')[1]!);
        const fee = BigInt(data.fee);
        console.log("feeeeee:" , fee);
        console.log("datafeeeeee: ", data.amount);
        const e = { value: { 'tx-receiver': data['tx-receiver'], amount: data.amount, fee: fee.toString() } };
        console.log("eeeeee: ", e.value);
        await snap.request({
          method: 'snap_updateInterface',
          params: {
            id,
            ui: (await sendTxFromExpended(id, e)).ui,
          },
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (event.type === UserInputEventType.FormSubmitEvent) {
    // console.log("---------------event name: ", event.name, event.name === 'valid-tx');
    switch (event.name) {

      case 'valid-tx':
        console.log("VALID TX");
        await snap.request({
          method: 'snap_updateInterface',
          params: {
            id,
            ui: (await validTx(id, event)).ui,
          },
        });

        break;

      default:
        break;
    }
  }

  // console.log("event: ", event);
};

// check if the event contains all the required parameters
export function checkSendTxParams(event: any): boolean {
  console.log("checkSendTxParams event: ", event.value);
  // console.log("event: ", event.value);
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

  if (amountFromString(event.value['amount'], 18) <= 0 || amountFromString(event.value['fee'], 18) <= 0) {
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