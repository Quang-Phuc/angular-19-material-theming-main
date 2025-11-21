// src/app/admin/models/ticket-point.model.ts
export type Region = 'MB' | 'MN' | 'MT';

export interface TicketPoint {
  id?: number;
  name: string;
  region: Region;
  province: string;
  district?: string;
  address: string;
  hotline?: string;
  note?: string;
  lat?: number;
  lng?: number;
}
