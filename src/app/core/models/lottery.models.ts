// src/app/core/models/lottery.models.ts
export type PrizeKey = 'DB' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7';

export interface PrizeMap {
  DB: string[]; G1: string[]; G2: string[]; G3: string[];
  G4: string[]; G5: string[]; G6: string[]; G7: string[];
}

export interface DayResult {
  prizes: PrizeMap;
}

export interface LiveState {
  currentPrize: PrizeKey | 'DONE';
  prizes: PrizeMap;
}

export interface HeadsRow {
  head: number;
  values: string[];
}
