import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  ApiPagedResponse,
  toPagedResult
} from '../models/api.model';

const BASE_URL = '/v1/pledges';

export interface PledgeListItem {
  id: string;
  storeId?: string;
  contractCode: string;
  loanDate: string | Date;
  dueDate?: string | Date;
  customerName: string;
  assetName?: string;
  loanAmount: number;
  interestRate?: number;
  totalPaid?: number;
  remainingPrincipal?: number;
  interestToday?: number;
  interestPeriod?: string;
  loanStatus: string;
}

export interface PledgeContract {
  id: string;
  storeId?: string;
  customer?: any;
  loan?: any;
  fees?: any;
  collateral?: any[];
}

export interface PledgeUpdatePayload {
  customer: NonNullable<PledgeContract['customer']>;
  loan: NonNullable<PledgeContract['loan']>;
  fees?: NonNullable<PledgeContract['fees']>;
  collateral?: NonNullable<PledgeContract['collateral']>;
}

export interface SearchFilters {
  keyword?: string;
  loanStatus?: string;
  pledgeState?: string;
  fromDate?: string | Date | null;
  toDate?: string | Date | null;
  follower?: string;
  storeId?: string | null;
  page?: number;
  size?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PledgeService {
  private api = inject(ApiService);

  getPledgeById(id: string): Observable<PledgeContract> {
    return this.api.get<ApiResponse<PledgeContract>>(`${BASE_URL}/${id}`)
      .pipe(map(res => res.data));
  }

  updatePledge(id: string, body: PledgeUpdatePayload): Observable<boolean> {
    return this.api.put<ApiResponse<unknown>>(`${BASE_URL}/${id}`, body)
      .pipe(map(() => true));
  }

  createPledge(body: PledgeUpdatePayload): Observable<boolean> {
    return this.api.post<ApiResponse<unknown>>(`${BASE_URL}`, body)
      .pipe(map(() => true));
  }

  deletePledge(id: string): Observable<boolean> {
    return this.api.delete<ApiResponse<unknown>>(`${BASE_URL}/${id}`)
      .pipe(map(() => true));
  }

  // ✅ SỬA Ở ĐÂY: Ánh xạ theo ApiPagedResponse (data.content / data.totalElements)
  searchPledges(filters: SearchFilters): Observable<PagedResult<PledgeListItem>> {
    const toIso = (d: string | Date) => new Date(d).toISOString();

    const params: any = {};
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.loanStatus) params.loanStatus = filters.loanStatus;
    if (filters.pledgeState) params.pledgeState = filters.pledgeState;
    if (filters.follower) params.follower = filters.follower;
    if (filters.storeId) params.storeId = filters.storeId;
    if (filters.fromDate) params.fromDate = toIso(filters.fromDate);
    if (filters.toDate) params.toDate = toIso(filters.toDate);
    if (filters.page != null) params.page = filters.page;
    if (filters.size != null) params.size = filters.size;

    return this.api
      .get<ApiPagedResponse<PledgeListItem>>(`${BASE_URL}`, { params })
      .pipe(
        map((resp) => {
          const pr = toPagedResult(resp);
          return {
            items: pr.items,
            total: pr.total,
            page: pr.page,
            size: pr.size,
            totalPages: pr.totalPages,
            first: pr.first,
            last: pr.last
          } as PagedResult<PledgeListItem>;
        })
      );
  }
}
