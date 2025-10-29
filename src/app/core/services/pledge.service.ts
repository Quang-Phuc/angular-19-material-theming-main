import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

// === CÁC INTERFACE CHUNG ===

// Interface từ 'license.service.ts' để tái sử dụng
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
  number: number; // Current page (zero-based)
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

// === CÁC INTERFACE RIÊNG CHO CẦM ĐỒ ===

export interface PledgeCustomer {
  hoTen: string;
  ngaySinh?: string | null;
  soCCCD?: string | null;
  soDienThoai: string;
  diaChi?: string | null;
  ngayCapCCCD?: string | null;
}

export interface PledgeLoanInfo {
  tenTaiSan: string;
  loaiTaiSan: string;
  ngayVay: string;
  maHopDong?: string | null;
  tongTienVay: number; // <-- Thuộc tính bắt buộc
  kyDongLai_So: number;
  kyDongLai_DonVi: 'Ngay' | 'Thang' | 'Nam';
  laiSuat_So: number;
  laiSuat_DonVi: 'PhanTram' | 'TienMat'; // Ví dụ: %/tháng hoặc Triệu/kỳ
  soLanTra: number;
  kieuThuLai: 'Truoc' | 'Sau';
  ghiChu?: string | null;
}

// Interface đầy đủ cho một Hợp đồng (kết hợp từ list và dialog)
export interface PledgeContract {
  id?: string; // Mã HĐ (CD252710-001)

  // Thông tin khách vay
  customer: PledgeCustomer;

  // Thông tin khoản vay
  loan: PledgeLoanInfo;

  // Thông tin từ list view (API get list có thể trả về)
  ngayHetHan?: string;
  collateralDisplay?: string; // Tên tài sản hiển thị (Xe SH...)
  loanAmount?: number; // = tongTienVay
  interestRateDisplay?: string; // Hiển thị lãi suất (1.5%/tháng)
  paid?: number;
  remaining?: number;
  interestToday?: number;
  interestPeriod?: string; // (1 kỳ)
  status?: string; // (Nợ)

  // TODO: Thêm các mục khác nếu cần
  // feesInfo?: any;
  // collateralInfo?: any;
  // attachments?: any;
}


@Injectable({
  providedIn: 'root'
})
export class PledgeService {

  private apiService = inject(ApiService);
  private apiUrl = '/pledges'; // Endpoint API ví dụ cho Hợp đồng cầm đồ

  constructor() { }

  /**
   * Lấy danh sách hợp đồng (Phân trang)
   */
  getPledges(
    page: number,
    size: number,
    filter: { keyword: string, loanStatus: string, pledgeState: string, timeRange: string | null }
  ): Observable<PagedResponse<PledgeContract>> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('keyword', filter.keyword || '')
      .set('status', filter.loanStatus || 'dang_vay')
      .set('state', filter.pledgeState || 'tat_ca');

    if (filter.timeRange) {
      params = params.set('time', filter.timeRange);
    }

    // === GIẢ LẬP API PHÂN TRANG ===
    // Thay thế bằng lệnh GET API thật
    // return this.apiService.get<ApiResponse<ApiPagedData<PledgeContract>>>(this.apiUrl, params).pipe(
    //   map(response => {
    //     const apiPagedData = response.data;
    //     return {
    //       content: apiPagedData.content, // TODO: Map lại data nếu cần
    //       totalElements: apiPagedData.totalElements,
    //       totalPages: apiPagedData.totalPages,
    //       number: apiPagedData.number,
    //       size: apiPagedData.size,
    //     };
    //   })
    // );

    // Sử dụng MOCK_DATA từ list component để giả lập
    const mockData = MOCK_DATA; // (Dùng MOCK_DATA từ file list component)
    const pagedData: PagedResponse<PledgeContract> = {
      content: mockData.map(item => ({ // Map dữ liệu mock sang interface
        id: item.id,
        customer: { hoTen: item.customerName, soDienThoai: 'N/A' }, // Giả lập

        // *** SỬA LỖI TẠI ĐÂY ***
        // Đổi 'loanAmount' thành 'tongTienVay' để khớp với interface PledgeLoanInfo
        loan: {
          tenTaiSan: item.collateral,
          tongTienVay: item.loanAmount, // <-- Đã sửa
          laiSuat_So: 0,
          kyDongLai_So: 0,
          kyDongLai_DonVi: 'Thang',
          laiSuat_DonVi: 'PhanTram',
          soLanTra: 0,
          kieuThuLai: 'Sau',
          ngayVay: item.ngayVay,
          loaiTaiSan: 'Xe Máy'
        }, // Giả lập

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
      totalElements: mockData.length,
      totalPages: 1,
      number: 0,
      size: 10
    };
    return of(pagedData); // Trả về Observable
  }

  /**
   * Lấy chi tiết 1 hợp đồng
   */
  getPledgeById(id: string): Observable<PledgeContract> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.get<ApiResponse<PledgeContract>>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Tạo hợp đồng mới
   */
  createPledge(data: PledgeContract): Observable<PledgeContract> {
    return this.apiService.post<ApiResponse<PledgeContract>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Cập nhật hợp đồng
   */
  updatePledge(id: string, data: PledgeContract): Observable<PledgeContract> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.put<ApiResponse<PledgeContract>>(url, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Xóa hợp đồng
   */
  deletePledge(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.apiService.delete<ApiResponse<void>>(url).pipe(
      map(response => {})
    );
  }
}

// Dữ liệu mock (lấy từ file list component) để service này có thể chạy giả lập
const MOCK_DATA: any[] = [
  { id: 'CD252710-001', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-26'), customerName: 'Nguyễn Văn C', collateral: 'SH 2021', loanAmount: 10000000, interestRate: '1.5%/tháng', paid: 0, remaining: 10000000, interestToday: 1050000, interestPeriod: '1 kỳ', status: 'Nợ' },
  { id: 'CD252310-005', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-21'), customerName: 'Nguyễn Văn A', collateral: 'Xe SH mod...', loanAmount: 20000000, interestRate: '1 triệu/kỳ', paid: 400000, remaining: 20000000, interestToday: 1000000, interestPeriod: '1 kỳ', status: 'Nợ' },
  { id: 'CD252310-004', ngayVay: new Date('2025-10-23'), ngayHetHan: new Date('2025-11-21'), customerName: 'Nguyễn Văn A', collateral: 'SH mode', loanAmount: 20000000, interestRate: '250k/kỳ', paid: 100000, remaining: 20000000, interestToday: 250000, interestPeriod: '1 kỳ', status: 'Nợ' }
];
