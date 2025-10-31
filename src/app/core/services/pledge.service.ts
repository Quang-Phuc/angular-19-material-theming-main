// pledge.service.ts (ĐÃ CẬP NHẬT)
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

// (Các interface ApiResponse, ApiPagedData giữ nguyên)
export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T;
}
export interface ApiPagedData<T> {
  content: T[]; pageable: any; totalElements: number; last: boolean;
  totalPages: number; size: number; number: number; sort: any;
  numberOfElements: number; first: boolean; empty: boolean;
}

// *** ĐÃ CÓ: Interface PagedResponse (để map từ ApiPagedData) ***
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PledgeCustomer {
  hoTen: string; ngaySinh?: string | null; soCCCD?: string | null;
  soDienThoai: string; diaChi?: string | null; ngayCapCCCD?: string | null;
}
export interface PledgeLoanInfo {
  tenTaiSan: string; loaiTaiSan: string; ngayVay: string;
  maHopDong?: string | null; tongTienVay: number; kyDongLai_So: number;
  kyDongLai_DonVi: 'Ngay' | 'Thang' | 'Nam'; laiSuat_So: number;
  laiSuat_DonVi: 'PhanTram' | 'TienMat'; soLanTra: number;
  kieuThuLai: 'Truoc' | 'Sau'; ghiChu?: string | null;
}

// Interface đầy đủ cho một Hợp đồng
export interface PledgeContract {
  id?: string; // Mã HĐ (CD252710-001)

  // *** THÊM MỚI 1: Thêm storeId ***
  storeId?: string;

  // Thông tin khách vay
  customer: PledgeCustomer;

  // Thông tin khoản vay
  loan: PledgeLoanInfo;

  // Thông tin từ list view
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


@Injectable({
  providedIn: 'root'
})
export class PledgeService {

  private apiService = inject(ApiService);
  private apiUrl = '/pledges';

  constructor() { }

  /**
   * Lấy danh sách hợp đồng (Phân trang)
   */
  getPledges(
    page: number,
    size: number,
    // *** THAY ĐỔI 2: 'filter' giờ sẽ tự động chứa 'storeId' ***
    filter: any
  ): Observable<PagedResponse<PledgeContract>> {  // *** SỬ DỤNG PagedResponse Ở ĐÂY ***

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('keyword', filter.keyword || '')
      .set('status', filter.loanStatus || 'dang_vay')
      .set('state', filter.pledgeState || 'tat_ca');

    if (filter.timeRange) {
      params = params.set('time', filter.timeRange);
    }

    // *** THÊM MỚI 3: Thêm storeId vào params nếu có ***
    if (filter.storeId) {
      params = params.set('storeId', filter.storeId);
    }

    // === GIẢ LẬP API PHÂN TRANG (ĐÃ CẬP NHẬT LOGIC LỌC) ===
    // (Bỏ comment phần dưới và xóa phần mock khi kết nối API thật)
    /*
    return this.apiService.get<ApiResponse<ApiPagedData<PledgeContract>>>(this.apiUrl, params).pipe(
      map(response => {
        const apiPagedData = response.data;
        return {
          content: apiPagedData.content,
          totalElements: apiPagedData.totalElements,
          totalPages: apiPagedData.totalPages,
          number: apiPagedData.number,
          size: apiPagedData.size,
        } as PagedResponse<PledgeContract>;  // *** MAP VÀO PagedResponse ***
      })
    );
    */

    // *** THAY ĐỔI 4: Cập nhật logic mock data để lọc theo storeId ***
    const mockData = MOCK_DATA;
    let filteredData = mockData;

    // Lọc theo storeId (nếu có)
    if (filter.storeId) {
      filteredData = mockData.filter(p => p.storeId === filter.storeId);
    }

    // Lọc theo keyword (ví dụ)
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      filteredData = filteredData.filter(
        p => p.customerName.toLowerCase().includes(keyword) ||
          p.collateral.toLowerCase().includes(keyword)
      );
    }

    const pagedData: PagedResponse<PledgeContract> = {  // *** SỬ DỤNG PagedResponse Ở ĐÂY ***
      content: filteredData.map(item => ({
        id: item.id,
        storeId: item.storeId, // <-- Thêm storeId vào response
        customer: { hoTen: item.customerName, soDienThoai: 'N/A' },
        loan: {
          tenTaiSan: item.collateral,
          tongTienVay: item.loanAmount,
          laiSuat_So: 0, kyDongLai_So: 0, kyDongLai_DonVi: 'Thang',
          laiSuat_DonVi: 'PhanTram', soLanTra: 0, kieuThuLai: 'Sau',
          ngayVay: item.ngayVay, loaiTaiSan: 'Xe Máy'
        },
        ngayHetHan: item.ngayHetHan,
        collateralDisplay: item.collateral,
        loanAmount: item.loanAmount,
        interestRateDisplay: item.interestRate,
        paid: item.paid,
        remaining: item.remaining,
        interestToday: item.interestToday,
        interestPeriod: item.interestPeriod,
        status: item.status
      })),
      totalElements: filteredData.length, // <-- Dùng độ dài của data đã lọc
      totalPages: 1,
      number: 0,
      size: 10
    };
    return of(pagedData);
  }

  // (Các hàm getPledgeById, createPledge, updatePledge, deletePledge giữ nguyên)

  getPledgeById(id: string): Observable<PledgeContract> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.get<ApiResponse<PledgeContract>>(url).pipe(
      map(response => response.data)
    );
  }
  createPledge(data: PledgeContract): Observable<PledgeContract> {
    return this.apiService.post<ApiResponse<PledgeContract>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }
  updatePledge(id: string, data: PledgeContract): Observable<PledgeContract> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.put<ApiResponse<PledgeContract>>(url, data).pipe(
      map(response => response.data)
    );
  }
  deletePledge(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.delete<ApiResponse<void>>(url).pipe(
      map(response => {})
    );
  }
}

// *** THAY ĐỔI 5: Thêm 'storeId' vào MOCK_DATA để giả lập ***
const MOCK_DATA: any[] = [
  { id: 'CD252710-001', storeId: 'store_1', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-26'), customerName: 'Nguyễn Văn C (Tiệm 1)', collateral: 'SH 2021', loanAmount: 10000000, interestRate: '1.5%/tháng', paid: 0, remaining: 10000000, interestToday: 1050000, interestPeriod: '1 kỳ', status: 'Nợ' },
  { id: 'CD252310-005', storeId: 'store_1', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-21'), customerName: 'Nguyễn Văn A (Tiệm 1)', collateral: 'Xe SH mode', loanAmount: 20000000, interestRate: '1 triệu/kỳ', paid: 400000, remaining: 20000000, interestToday: 1000000, interestPeriod: '1 kỳ', status: 'Nợ' },
  { id: 'CD252310-004', storeId: 'store_2', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-21'), customerName: 'Trần Thị B (Tiệm 2)', collateral: 'Vision 2022', loanAmount: 5000000, interestRate: '250k/kỳ', paid: 100000, remaining: 5000000, interestToday: 250000, interestPeriod: '1 kỳ', status: 'Nợ' }
];
