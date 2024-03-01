import { OnHomePageHandler } from "@metamask/snaps-sdk";
import { createInterface } from "./ui";
import { resetState } from "../utils/utxoDB";


/* 
should display :
- eth balance
- display address (copyable) -> ok
- token balance 
- send button (eth and tokens)
- view utxos
- view tx history
- address qr Code ?
*/

/**
 * Handle incoming home page requests from the MetaMask clients.
 * Create a new Snap Interface and return it.
 *
 * @returns A static panel rendered with custom UI.
 * @see https://docs.metamask.io/snaps/reference/exports/#onhomepage
 */
export const onHomePage: OnHomePageHandler = async () => {
  const interfaceId = await createInterface();
  return { id: interfaceId };
};
