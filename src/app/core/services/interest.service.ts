// src/app/features/interest/interest.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface ApiResponse<T> {
  timeStamp: string;
  securityVersion: string;
  result: 'success' | 'fail';
  message: string;
  errorCode: string;
  data: T;
}

export interface PageMeta {
  totalPages: number;
  last: boolean;
  totalElements: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface PageData<T> extends PageMeta {
  content: T[];
}

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  last: boolean;
  totalElements: number;
  number: number;
  size: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface InterestSummary {
  contractCode: string;
  customerName: string;
  phoneNumber: string;
  loanDate: string;          // yyyy-MM-dd
  dueDate?: string | null;
  follower?: string;
  pledgeStatus?: string;

  // số liệu hiển thị đầu trang
  loanAmount: number;            // gốc ban đầu
  remainingPrincipal: number;    // gốc còn lại
  interestToday: number;         // lãi đến hôm nay
  totalPaid: number;             // tổng đã thu
  /** LỊCH SỬ TRẢ BỚT GỐC – CHI TIẾT NHẤT */
  principalReductionHistory: PrincipalReductionHistoryItem[];
}

export interface PrincipalReductionHistoryItem {
  /** ID bản ghi (nếu có) */
  id?: number;

  /** Ngày khách trả bớt gốc */
  date: string;                          // yyyy-MM-dd

  /** Tên người thực hiện (nhân viên thu tiền) */
  createdBy: string;                     // VD: "Nguyễn Thị Thu"

  /** Tên khách hàng (để hiển thị, tránh lỗi khi đổi tên sau này) */
  customerName: string;

  /** Số tiền trả bớt gốc */
  amount: number;                        // 5.000.000

  /** Gốc còn lại SAU khi trả bớt */
  remainingPrincipalAfter: number;       // 15.000.000

  /** Lãi suất TRƯỚC khi trả bớt */
  oldInterestRate: number;               // 2.5

  /** Lãi suất MỚI (nếu được giảm) – có thể null */
  newInterestRate?: number | null;       // 1.8

  /** Đơn vị lãi suất */
  interestRateUnit: 'PER_MILLE' | 'PER_MILLION';

  /** Phí khác (phí xử lý, phí giảm lãi suất…) */
  otherFee: number;                      // 200.000

  /** Tổng tiền khách nộp lần này */
  totalPaidThisTime: number;             // amount + otherFee

  /** Ghi chú */
  note?: string;

  /** Thời gian tạo bản ghi */
  createdAt: string;                     // 2025-11-18T10:30:00
}
export interface InterestSummary2 {
  // === THÔNG TIN HỢP ĐỒNG ===
  contractCode: string;                    // CĐ251411-002
  customerName: string;                    // Nguyễn Văn A
  phoneNumber: string;                     // 0901234567
  loanDate: string;                        // yyyy-MM-dd
  dueDate?: string | null;                 // ngày đến hạn (nếu có kỳ hạn cố định)
  follower?: string;                       // Nhân viên phụ trách
  pledgeStatus?: string;                   // DANG_VAY, QUA_HAN, DA_TRA_HET, DA_DONG

  // === SỐ LIỆU GỐC & HIỆN TẠI ===
  loanAmount: number;                      // Số tiền vay ban đầu: 100.000.000
  remainingPrincipal: number;              // Gốc còn lại sau các lần trả bớt: 75.000.000

  // === LÃI & PHẠT ===
  interestRatePerDay: number;              // Lãi suất hiện tại (‰/ngày hoặc đ/triệu/ngày) → VD: 2.0 hoặc 5000
  interestRateUnit: 'PER_MILLE' | 'PER_MILLION'; // ‰/ngày hay đ/triệu/ngày
  interestToday: number;                   // Tổng lãi tính đến hôm nay (các kỳ + dôi)
  totalInterestAllPeriods: number;         // Tổng lãi tất cả các kỳ đã tạo
  penaltyInterest: number;                 // Tổng phạt quá hạn hiện tại

  // === PHÍ & KHO BÃI ===
  totalWarehouseFee: number;               // Tổng phí kho bãi đến nay
  totalServiceFee: number;                 // Tổng phí dịch vụ (thẩm định, quản lý…)

  // === TỔNG HỢP ===
  totalReceivable: number;                 // Tổng phải thu = gốc + lãi + phạt + phí kho + phí DV
  totalPaid: number;                       // Tổng đã thanh toán (gốc + lãi + phí)
  remainingAmount: number;                 // Còn phải thu = totalReceivable - totalPaid

  // === TRẠNG THÁI & NGÀY ===
  daysOverdue?: number;                    // Số ngày quá hạn (nếu có)
  totalDaysLoan?: number;                  // Tổng số ngày đã vay tính đến nay
  nextDueDate?: string;                    // Ngày đến hạn kỳ tiếp theo (nếu có lịch kỳ)

  // === LỊCH SỬ TRẢ BỚT GỐC (dùng cho popup trả bớt) ===
  principalReductionHistory?: Array<{
    date: string;                          // yyyy-MM-dd
    amount: number;                        // Số tiền trả bớt
    oldRate: number;                       // Lãi suất trước khi giảm
    newRate?: number;                      // Lãi suất sau khi giảm (nếu có)
    otherFee: number;                      // Phí khác (nếu có)
    note?: string;
  }>;

  // === THÔNG TIN TÀI SẢN (nếu cần hiển thị) ===
  assets?: Array<{
    name: string;
    type: string;
    valuation: number;
  }>;
}
export interface CloseInterestDetailRow {
  id: number;
  contractId: number;
  periodNumber: number;
  dueDate: string;              // yyyy-MM-dd
  interestAmount: number;       // BigDecimal -> number
  warehouseDailyFee: number;       // BigDecimal -> number
  principalAmount: number;      // BigDecimal -> number
  totalAmount: number;          // BigDecimal -> number
  paidAmount: number;          // BigDecimal -> number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | string;
  paidDate?: string | null;     // yyyy-MM-dd | null
  penaltyInterest: number;
  /** Thêm để match API */
  transactions: PaymentScheduleTransaction[];
}

export interface PaymentScheduleTransaction {
  id: number;
  paymentScheduleId: number;
  amount: number;
  paymentDate: string;
  type?: string | null;
  note?: string | null;
}

export interface ContractInfo {
  loanDate: string;
  contractCode?: string | null;
  loanAmount: number;
  interestTermValue: number;
  interestTermUnit: 'DAY' | 'MONTH';
  interestRateValue: number;
  interestRateUnit: 'INTEREST_PER_MILLION_PER_DAY' | 'INTEREST_PERCENT_PER_MONTH' | 'INTEREST_PER_DAY';
  paymentCount: number;
  interestPaymentType: 'PERIODIC_INTEREST' | string;
  note?: string;
  loanStatus?: string;
  partnerType?: string;
  follower?: string;
  customerSource?: string;
}

export interface InterestHistoryRow {
  id: number;
  createdAt: string;         // yyyy-MM-dd HH:mm:ss
  periodNumber?: number | null;
  amount: number;            // số tiền thu lãi
  note?: string;
  cashier?: string;
}

export interface OneTimeFeeRow {
  id: number;
  createdAt: string;
  feeType: string;           // warehouseFee / storageFee / riskFee / managementFee / OTHER
  amount: number;
  note?: string;
  cashier?: string;
}

@Injectable({ providedIn: 'root' })
export class InterestService {
  constructor(private api: ApiService) {}

  /** Header tóm tắt (đầu dialog) */
  getSummary(pledgeId: number): Observable<ApiResponse<InterestSummary>> {
    return this.api.get<ApiResponse<InterestSummary>>(`/v1/interests/${pledgeId}/summary`);
  }

  /** Tab 1: Chi tiết đóng lãi (lịch các kỳ) + phân trang */
  getDetails(pledgeId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<CloseInterestDetailRow>>> {
    return this.api.get<ApiResponse<PageResponse<CloseInterestDetailRow>>>(`/v1/interests/${pledgeId}/details`, {
      params: { page, size }
    });
  }

  /** Tab 2: Thông tin hợp đồng */
  getContract(pledgeId: number): Observable<ApiResponse<ContractInfo>> {
    return this.api.get<ApiResponse<ContractInfo>>(`/v1/interests/${pledgeId}/contract`);
  }

  /** Tab 3: Lịch sử đóng lãi (phân trang) */
  getInterestHistory(pledgeId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<InterestHistoryRow>>> {
    return this.api.get<ApiResponse<PageResponse<InterestHistoryRow>>>(`/v1/interests/${pledgeId}/payment-history`, {
      params: { page, size }
    });
  }

  /** Tab 4: Lịch sử thu phí 1 lần (phân trang) */
  getOneTimeFees(pledgeId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<OneTimeFeeRow>>> {
    return this.api.get<ApiResponse<PageResponse<OneTimeFeeRow>>>(`/v1/interests/${pledgeId}/one-time-fees`, {
      params: { page, size }
    });
  }

  /** 4 hành động chung */
  settle(pledgeId: number, body: { amount: number; settleDate: string; note?: string }) {
    return this.api.post<ApiResponse<any>>(`/v1/interests/${pledgeId}/settle`, body);
  }

  extendTerm(pledgeId: number, body: { termNumber: number; extendDays: number; reason?: string }) {
    return this.api.post<ApiResponse<any>>(`/v1/interests/${pledgeId}/extend`, body);
  }

  partialPrincipal(pledgeId: number, body: { amount: number; date: string; note?: string }) {
    return this.api.post<ApiResponse<any>>(`/v1/interests/${pledgeId}/partial-principal`, body);
  }

  additionalLoan(pledgeId: number, body: { amount: number; date: string; note?: string }) {
    return this.api.post<ApiResponse<any>>(`/v1/interests/${pledgeId}/additional-loan`, body);
  }

  /** Export danh sách theo tab hiện tại */
  export(pledgeId: number, tab: 'details' | 'payment-history' | 'one-time-fees' | 'contract', type: 'pdf' | 'excel') {
    const endpoint = `/v1/interests/${pledgeId}/export/${tab}`;
    return this.api.download(endpoint, { type });
  }

  /** Đóng lãi một kỳ cụ thể */
  // interest.service.ts
  payInterest(
    pledgeId: number,
    body: {
      periodNumber: number;
      payDate: string;
      amount: number;
      paymentMethod: string;  // Thêm field
      id: number;  // Thêm field
      note?: string;
    }
  ): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(
      `/v1/interests/${pledgeId}/pay-interest`,
      body
    );
  }

}
