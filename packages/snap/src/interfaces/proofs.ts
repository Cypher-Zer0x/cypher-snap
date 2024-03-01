import { Point } from '../utils';


export interface Mlsag {
  message: string,
  ring: Point[][],
  c: bigint,
  responses: bigint[][],
  keyImages: Point[]
}


export interface LightRangeProof {
  V: string,
  A: string,
  S: string,
  T1: string,
  T2: string,
  tx: string,
  txbf: string,
  e: string,
  a0: string,
  b0: string,
  ind: {L: string, R: string}[],
}

export interface RangeProof extends LightRangeProof {
  G: string,
  order: string,
}