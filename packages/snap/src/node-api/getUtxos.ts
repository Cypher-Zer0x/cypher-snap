import { UTXO } from "../interfaces";

/**
 * get all the utxos from the network
 * 
 * @param api - The API endpoint to use
 * @param start_index - The block index to start from (optional but recommended for faster results)
 */
export async function getUtxos(api: string): Promise<UTXO[]> {

  const utxoSet = await fetch(`${api}/utxo/set`).then((res) => res.json());

  let utxos: UTXO[] = [];
  // list the keys
  for (let key in utxoSet) {
    utxos = utxos.concat(utxoSet[key]);
  }

  return utxos.map((utxo: any) => {
    if (utxo.Payment) {
      return utxo.Payment;
    }
    if (utxo.Coinbase) {
      return utxo.Coinbase;
    } else if (utxo.Exit) {
      return utxo.Exit;
    }
    console.warn("Unknown utxo type: ", utxo, '\nIgnoring it');
  });
}

// getUtxos("https://api.zer0x.xyz").then(console.log);