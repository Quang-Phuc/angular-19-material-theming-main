// src/app/admin/models/vietlott-result.model.ts
export type VietlottGame =
  | 'POWER_655'
  | 'MEGA_645'
  | 'MAX_3D'
  | 'MAX_3D_PLUS'
  | 'KENO';

export interface VietlottResult {
  id?: number;
  drawDate: string;  // yyyy-MM-dd
  game: VietlottGame;
  code?: string;
  numbers: string;   // "01 05 12 23 30 55"
  extra?: string;    // "10, 23"
  jackpot?: string;  // "45 tỷ"
  note?: string;
}
