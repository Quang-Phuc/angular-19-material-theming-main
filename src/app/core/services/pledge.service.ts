// src/app/core/services/pledge.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

/* -------------------------------------------------------------------------- */
/*                           COMMON RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */
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

/* --------------------------- PAGED RESPONSE ---------------------------- */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/* -------------------------------------------------------------------------- */
/*                           PLEDGE CONTRACT INTERFACES                       */
/* -------------------------------------------------------------------------- */
export interface PledgeCustomer {
  fullName: string;
  dateOfBirth?: string | null;
  identityNumber?: string | null;
  phoneNumber: string;
  permanentAddress?: string | null;
  issueDate?: string | null;
  issuePlace?: string | null;
  /*** Các trường mở rộng (extra + family) ***/
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
  /*** Ảnh chân dung ***/
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
  interestPaymentType:
    | 'PERIODIC_INTEREST'
    | 'INSTALLMENT'
    | 'LUMP_SUM_END'
    | 'RENEWAL';
  note?: string | null;
  /*** Các trường phụ (extra) ***/
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
}
export interface PledgeCollateral {
  valuation?: number;
  warehouseId?: string;
  assetCode?: string;
  assetNote?: string;
  attributes?: CollateralAttribute[];
}

export interface PledgeContract {
  id?: string;
  storeId?: string;

  customer: PledgeCustomer;
  loan: PledgeLoanInfo;

  fees?: {
    warehouseFee?: FeeInfo;
    storageFee?: FeeInfo;
    riskFee?: FeeInfo;
    managementFee?: FeeInfo;
  };

  collateral?: PledgeCollateral;

  /*** Thông tin hiển thị trong list ***/
  ngayHetHan?: string;
  collateralDisplay?: string;
  loanAmount?: number;
  interestRateDisplay?: string;
  paid?: number;
  remaining?: number;
  interestToday?: number;
  interestPeriod?: string;
  status?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 SERVICE                                    */
/* -------------------------------------------------------------------------- */
@Injectable({ providedIn: 'root' })
export class PledgeService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/pledges';

  /* --------------------------- LIST (PAGED) --------------------------- */
  getPledges(
    page: number,
    size: number,
    filter: any
  ): Observable<PagedResponse<PledgeContract>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('keyword', filter.keyword ?? '')
      .set('status', filter.loanStatus ?? 'dang_vay')
      .set('state', filter.pledgeState ?? 'tat_ca');

    if (filter.timeRange) params = params.set('time', filter.timeRange);
    if (filter.storeId) params = params.set('storeId', filter.storeId);

    return this.api
      .get<ApiResponse<ApiPagedData<PledgeContract>>>(this.base, params)
      .pipe(
        map(res => ({
          content: res.data.content,
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
          number: res.data.number,
          size: res.data.size,
        } as PagedResponse<PledgeContract>))
      );
  }

  /* --------------------------- DETAIL --------------------------- */
  getPledgeById(id: string): Observable<PledgeContract> {
    return this.api
      .get<ApiResponse<PledgeContract>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }

  /* --------------------------- CREATE --------------------------- */
  createPledge(data: PledgeContract): Observable<PledgeContract> {
    return this.api
      .post<ApiResponse<PledgeContract>>(this.base, data)
      .pipe(map(res => res.data));
  }

  /* --------------------------- UPDATE --------------------------- */
  updatePledge(id: string, data: PledgeContract): Observable<PledgeContract> {
    return this.api
      .put<ApiResponse<PledgeContract>>(`${this.base}/${id}`, data)
      .pipe(map(res => res.data));
  }

  /* --------------------------- DELETE --------------------------- */
  deletePledge(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<void>>(`${this.base}/${id}`)
      .pipe(map(() => void 0));
  }
}
