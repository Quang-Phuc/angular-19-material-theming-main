// core/models/pledge-detail.model.ts
export interface PledgeDetailResponse {
  // === THÔNG TIN HỢP ĐỒNG ===
  contractCode: string;
  customerName: string;
  phoneNumber: string;
  loanDate: string;
  dueDate: string;
  follower: string;
  pledgeStatus: string;

  // === SỐ LIỆU TÀI CHÍNH ===
  loanAmount: number;                    // Gốc ban đầu
  remainingPrincipal: number;            // Gốc còn lại
  totalInterest: number;                 // Tổng lãi tất cả kỳ
  totalWarehouseFee: number;             // Tổng phí kho
  totalServiceFee: number;               // Tổng phí DV
  penaltyInterest: number;               // Tổng phạt quá hạn
  totalReceivable: number;               // Tổng phải thu
  totalPaid: number;                     // Tổng đã thu
  remainingAmount: number;               // Còn nợ

  // === LÃI SUẤT HIỆN TẠI ===
  currentInterestRate: number;           // 2.0 hoặc 2000
  interestRateUnit: 'PER_MILLE' | 'PER_MILLION';

  // === LỊCH SỬ TRẢ BỚT GỐC ===
  principalReductionHistory: PrincipalReductionHistoryItem[];

  // === TÀI SẢN ===
  assets: AssetItem[];

  // === PHÍ DỊCH VỤ CHI TIẾT (nếu cần) ===
  serviceFees?: ServiceFeeItem[];
}

export interface PrincipalReductionHistoryItem {
  date: string;
  amount: number;
  oldRate: number;
  newRate?: number | null;
  interestRateUnit: 'PER_MILLE' | 'PER_MILLION';
  otherFee: number;
  totalPaid: number;
  createdBy: string;
  note?: string;
}

export interface AssetItem {
  name: string;
  type: string;
  valuation: number;
  warehouseDailyFee: number;
}

export interface ServiceFeeItem {
  type: string;
  valueType: 'AMOUNT' | 'PERCENT';
  value: number;
}
