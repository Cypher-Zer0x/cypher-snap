// get the last block index from rpc
export async function getLastBlockIndex(api: string): Promise<number> {
  try {
    return (await fetch(`${api}/getLastBlock`).then((res) => res.json())).header.block_number;
  } catch (e) {
    console.error("Error getting last block index: ", e);
    return -1;
  }
}

// getLastBlockIndex("http://176.146.201.74:3000").then(console.log);