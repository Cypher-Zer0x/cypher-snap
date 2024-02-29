import { Curve, CurveName, Point } from ".";

export async function generateRing(): Promise<Point[][]> { // todo: GET RING FROM UTXO SET
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
  return ring;
}