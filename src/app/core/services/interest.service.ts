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
