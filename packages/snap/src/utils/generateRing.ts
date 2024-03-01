import { getUtxos } from "../node-api/getUtxos";
import { Curve, CurveName, Point } from ".";
import { api } from "../keys";

export async function generateRing(outputsNumber: bigint): Promise<Point[][]> { // todo: GET RING FROM UTXO SET
  const ringSize = 10;
  // get Payments UTXOs from the mempool
  const utxos = await getUtxos(api);
  const maxRounds = utxos.length % Number(outputsNumber);
  let ring: Point[][] = [];
  for (let i = 0; (i < outputsNumber && i < maxRounds); i++) {
    let ringSet: Point[] = [];
    for (let j = 0; j < ringSize; j++) {
      ringSet.push(Point.decompress(utxos[i * ringSize + j]!.public_key!));
    }
    ring.push(ringSet);
  }

  console.log("RING size: ", ring.length, ring[0]!.length);
  return ring;
}