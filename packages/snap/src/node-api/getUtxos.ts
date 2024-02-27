import { UTXO } from "../interfaces";

/**
 * get all the utxos from the network
 * 
 * @param api - The API endpoint to use
 * @param start_index - The block index to start from (optional but recommended for faster results)
 */
export async function getUtxos(api: string): Promise<UTXO[]> {

  const utxoSet = await fetch(`${api}/getUtxoSet`).then((res) => res.json());

  return utxoSet.map((utxo: UTXO) => utxo);
}

// getUtxos("http://176.146.201.74:3000").then(console.log);