import { getUtxos } from "../node-api/getUtxos";
import { Curve, CurveName, Point } from ".";
import { api } from "../keys";

// mocked fct, should use real utxo keys from the mempool
export async function generateRing(outputsNumber: bigint): Promise<Point[][]> { // todo: GET RING FROM UTXO SET
  //   const ringSize = 10;
  //   // get Payments UTXOs from the mempool
  //   const utxos = await getUtxos(api);
  //   const maxRounds = utxos.length % Number(outputsNumber);
  //   let ring1: Point[][] = [];
  //   for (let i = 0; (i < outputsNumber && i < maxRounds); i++) {
  //     let ringSet: Point[] = [];
  //     for (let j = 0; j < ringSize; j++) {
  //       console.log("pls don't be undefined: ", utxos[i * ringSize + j]!.public_key!);
  //       ringSet.push(Point.decompress(utxos[i * ringSize + j]!.public_key!));
  //     }
  //     ring1.push(ringSet);
  //   }
  //    if(ring1.length )

  //   console.log("RING: \n", JSON.stringify(ring1));
  //   // console.log("RING size: ", ring1.length, ring1[0]!.length);

  //   return ring1;
  // // }

  const curve = new Curve(CurveName.SECP256K1);
  const G = curve.GtoPoint();

  const ring: Point[][] = [];
  for (let i = 0; i < 5; i++) {
    const ringElement: Point[] = [];
    for (let j = 0; j < 2; j++) {
      ringElement.push(G.mult(BigInt(1 + Math.floor(Math.random()))));
    }

    ring.push(ringElement);
  }

  // console.log("RING size: ", ring.length, ring[0]!.length);
  return ring;
}