import { OnCronjobHandler } from '@metamask/snaps-sdk';
import { CoinbaseUTXO, PaymentUTXO } from '../interfaces';
import { getUtxos } from '../node-api/getUtxos';
import { saveUtxos } from '../utils/utxoDB';
import { getLocalUtxos } from '../utils/utxoDB';

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'retrieveUtxos':
      const utxos = await getUtxos("https://api.zer0x.xyz")

      // save the balance to the local storage
      await saveUtxos(utxos as (PaymentUTXO | CoinbaseUTXO)[]);

      console.log('Utxos retrieved and saved to local storage:\n', await getLocalUtxos());
      break;

    default:
      throw new Error('Method not found.');
  }
};