
export type Region = 'MB' | 'MN' | 'MT';
export interface TicketPoint {
  id?: number;
  name: string;
  region: 'MB' | 'MN' | 'MT';
  province: string;
  district?: string;
  address: string;

  hotline?: string;
  note?: string;

  // dịch vụ
  hasXsmb?: boolean;
  hasVietlott?: boolean;

  // giờ mở cửa
  openTime?: string;   // "08:00"
  closeTime?: string;  // "22:00"

  // vị trí
  lat?: number;
  lng?: number;
}
