// src/app/core/services/pledge.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PledgeSearchFilters } from '../models/pledge-search-filters.interface';

export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T;
}

export interface ApiPagedData<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  last: boolean;
  totalPages: number;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// --- Dành riêng cho màn hình danh sách hợp đồng cầm đồ ---
export interface PledgeContractListResponse {
  id: number;
  contractCode: string;
  loanDate: string;
  dueDate: string;
  customerName: string;
  phoneNumber: string;
  assetName: string;
  loanAmount: number;
  totalPaid: number;
  remainingPrincipal: number;
  status: string;
  follower: string;
  pledgeStatus: string;
  storeId: number;
}

export interface PledgeCustomer {
  fullName: string;
  dateOfBirth?: string | null;
  identityNumber?: string | null;
  phoneNumber: string;
  permanentAddress?: string | null;
  issueDate?: string | null;
  issuePlace?: string | null;
  customerCode?: string;
  occupation?: string;
  workplace?: string;
  householdRegistration?: string;
  email?: string;
  incomeVndPerMonth?: number;
  note?: string;
  contactPerson?: string;
  contactPhone?: string;
  spouseName?: string;
  spousePhone?: string;
  spouseOccupation?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  idUrl?: string;
}

export interface PledgeLoanInfo {
  assetName: string;
  assetTypeId: string;
  loanDate: string;
  contractCode?: string | null;
  loanAmount: number;
  interestTermValue: number;
  interestTermUnit: 'DAY' | 'WEEK' | 'PERIODIC_MONTH' | 'MONTH';
  interestRateValue: number;
  interestRateUnit: string;
  paymentCount: number;
  interestPaymentType: 'PERIODIC_INTEREST' | 'INSTALLMENT' | 'LUMP_SUM_END' | 'RENEWAL';
  note?: string | null;
  loanStatus?: string;
  partnerType?: string;
  follower?: string;
  customerSource?: string;
}

export interface FeeInfo {
  type: 'AMOUNT' | 'PERCENT';
  value: number;
}

export interface CollateralAttribute {
  label: string;
  value: string;
  id: number;
}

export interface PledgeCollateral {
  assetName: string;
  assetType: string;
  valuation?: number;
  warehouseId?: string;
  assetCode?: string;
  assetNote?: string;
  warehouseDailyFee?: string;
  attributes?: CollateralAttribute[];
}

export interface PledgeContract {
  id?: number | string;
  contractCode?: string;
  storeId?: number | string;
  customer: PledgeCustomer;
  loan: PledgeLoanInfo;
  fees?: {
    warehouseFee?: FeeInfo;
    storageFee?: FeeInfo;
    riskFee?: FeeInfo;
    managementFee?: FeeInfo;
  };
  collateral?: PledgeCollateral[];
  paymentSchedule?: PaymentScheduleItem[];

  // Các trường phụ hiển thị thêm (phía FE tự tính hoặc API trả)
  ngayHetHan?: string;
  collateralDisplay?: string;
  loanAmount?: number;
  interestRateDisplay?: string;
  paid?: number;
  remaining?: number;
  interestToday?: number;
  interestPeriod?: string;
  status?: string;

  // Thêm để đồng bộ API mới
  portraitUrl?: string;            // Ảnh chân dung
  attachments?: string[];          // Danh sách file đính kèm (chỉ tên)
}
export interface PaymentScheduleItem {
  periodNumber: number;
  dueDate: string;
  interestAmount: number;
  principalAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | string;
  paidDate?: string | null;
}


@Injectable({ providedIn: 'root' })
export class PledgeService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/pledges';

  getPledgeList(
    page: number,
    size: number,
    filter: PledgeSearchFilters
  ): Observable<PagedResponse<PledgeContractListResponse>> {
    return this.api.post<ApiResponse<ApiPagedData<PledgeContractListResponse>>>(
      `${this.base}/search`,
      { page, size, ...filter }
    ).pipe(
      map(res => ({
        content: res.data.content,
        totalElements: res.data.totalElements,
        totalPages: res.data.totalPages,
        number: res.data.number,
        size: res.data.size,
      }))
    );
  }

  getPledgeById(id: number): Observable<PledgeContract> {
    return this.api.get<ApiResponse<PledgeContract>>(`${this.base}/${id}`).pipe(map(res => res.data));
  }

  createPledge(data: PledgeContract): Observable<PledgeContract> {
    return this.api.post<ApiResponse<PledgeContract>>(this.base, data).pipe(map(res => res.data));
  }

  updatePledge(id: string, data: PledgeContract): Observable<PledgeContract> {
    return this.api.put<ApiResponse<PledgeContract>>(`${this.base}/${id}`, data).pipe(map(res => res.data));
  }

  deletePledge(id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => void 0));
  }
}
