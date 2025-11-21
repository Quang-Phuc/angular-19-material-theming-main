// src/app/admin/models/lottery-draw.model.ts
import { Region } from './ticket-point.model';

export interface LotteryDraw {
  id?: number;
  region: Region;
  province: string;
  drawDate: string;  // yyyy-MM-dd

  gDB: string;
  g1?: string;
  g2?: string;
  g3?: string;
  g4?: string;
  g5?: string;
  g6?: string;
  g7?: string;
}
