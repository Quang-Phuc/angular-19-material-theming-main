/**
 * Định nghĩa cấu trúc dữ liệu cho một Tiệm (Khách hàng)
 */
export interface Store {
  id: string;
  name: string;           // Tên tiệm
  ownerName: string;      // Tên chủ sở hữu
  phone: string;
  address?: string;
  status: 'active' | 'trial' | 'expired' | 'locked'; // Trạng thái
  licensePlan: string;    // Tên gói (Standard, Pro)
  expiryDate: string;     // Ngày hết hạn (ISO string)
  createdAt: string;
}

/**
 * Dùng cho API trả về danh sách có phân trang
 */
export interface StoreListResponse {
  data: Store[];
  total: number; // Tổng số bản ghi
}
