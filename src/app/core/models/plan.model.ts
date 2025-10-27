/**
 * Interface này định nghĩa cấu trúc dữ liệu cho một Gói License (Plan)
 * Dựa trên các yêu cầu bạn đã cung cấp.
 */
export interface Plan {
  id: string;
  name: string;             // Tên Gói (VD: Cơ bản, Chuyên nghiệp)
  code: string;             // Mã Gói (VD: standard, pro)
  description?: string;     // Mô tả ngắn
  priceMonth: number;       // Giá theo tháng
  priceYear?: number;      // Giá theo năm
  maxBranches: number;      // Số lượng Chi nhánh tối đa
  maxUsers: number;         // Số lượng Người dùng tối đa
  maxContracts?: number;    // Số lượng Hợp đồng tối đa
  features: {               // Các tính năng được phép (Feature Flags)
    hasMobileApp: boolean;
    hasZaloSms: boolean;
    hasAdvancedReport: boolean;
    hasApiAccess: boolean;
    hasPrioritySupport: boolean;
  };
  status: 'active' | 'inactive'; // Trạng thái: Đang hoạt động / Ngừng cung cấp
  isHighlighted: boolean;   // Đánh dấu nổi bật (Gói phổ biến)
  trialDays?: number;       // Số ngày dùng thử (nếu là gói trial)
  createdAt?: Date;
}

/**
 * Interface cho phản hồi API khi lấy danh sách (thường có phân trang)
 */
export interface PaginatedPlanResponse {
  data: Plan[];
  total: number;
  page: number;
  limit: number;
}
