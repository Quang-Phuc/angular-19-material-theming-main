// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs'; // Đã xóa throwError, of
import { map, tap } from 'rxjs/operators';
// import { HttpHeaders } from '@angular/common/http'; // Đã xóa
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {HttpParams} from '@angular/common/http';

// Ensure all these interfaces are exported
export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T;
}
export interface LicensePlan {
  id: number;
  name: string;
  description: string | null;
  maxStore: number;
  maxUserPerStore: number;
  price: number;
  discount: number;
  durationDays: number;
  isPopular?: boolean;
  features?: string[];
  themeColor?: 'green' | 'blue' | 'purple' | 'orange';
}
export interface UserInfo {
  id: number;
  name: string;
  storeId?: number;
}
export interface StoreInfo {
  id: number;
  name: string;
}
export interface LicenseStatus {
  status: 'valid' | 'expired' | 'not_found';
  expiryDate?: string;
  currentStoreCount?: number;
  currentUserCount?: number;
  stores?: StoreInfo[];
  users?: UserInfo[];
}
export interface CurrentUsage {
  storeCount: number;
  userCount: number;
  stores: StoreInfo[];
  users: UserInfo[];
}
export interface QrResponse {
  base64Data: string;
}
export interface HistoryRequest {
  licensePackageId: number;
}
export interface HistoryResponse {
  id: number;
}

/**
 * *** CẬP NHẬT INTERFACE: THÊM 'note' ***
 */
export interface LicenseHistoryEntry {
  id: number;
  packageCode: string; // Mã gói (vd: TRIAL, PRO)
  packageName: string; // Tên gói (vd: Dùng thử, Chuyên nghiệp)
  purchaseDate: string; // Ngày mua (API trả về dạng string ISO)
  amountPaid: number;   // Số tiền
  userId: number;       // ID người mua
  userName?: string;      // Tên người mua (optional)
  status: string;       // Trạng thái (vd: PENDING, COMPLETED, FAILED)
  note?: string;        // <-- THÊM GHI CHÚ (cho Admin)
  // Thêm các trường chi tiết khác nếu API trả về
  transactionCode?: string;
  paymentMethod?: string;
}

export interface ApiPagedData<T> {
  content: T[];
  pageable: any; // Or define pageable interface
  totalElements: number;
  last: boolean;
  totalPages: number;
  size: number;
  number: number; // Current page (zero-based)
  sort: any; // Or define sort interface
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // Trang hiện tại (zero-based)
  size: number;   // Kích thước trang
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private apiUrl = '/license-packages';
  private historyApiUrl = '/license-history';
  private currentCheck = '/license/check'; // <-- 2. SẼ SỬ DỤNG API NÀY
  private currentUsageUrl = '/license/check'; // <-- 2. SẼ SỬ DỤNG API NÀY

  private currentUsageSubject = new BehaviorSubject<CurrentUsage | null>(null);
  currentUsage$ = this.currentUsageSubject.asObservable();


  constructor() { }

  // --- Methods ---

  getLicensePlans(): Observable<LicensePlan[]> {
    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(
      map(response => {
        // (Logic "làm giàu" dữ liệu không thay đổi)
        const apiPlans = response.data;
        return apiPlans.map((plan: LicensePlan) => {
          let uiFeatures: string[] = [];
          let uiIsPopular = false;
          let uiThemeColor: LicensePlan['themeColor'] = 'blue';
          if (plan.name === 'TRIAL') { uiFeatures = [`Quản lý ${plan.maxStore} cửa hàng`,`${plan.maxUserPerStore} tài khoản/cửa hàng`,`Dùng thử ${plan.durationDays} ngày`,'Hỗ trợ cơ bản']; uiThemeColor = 'green'; }
          else if (plan.name === 'Cá Nhân') { uiFeatures = [`Quản lý ${plan.maxStore} cửa hàng`,`${plan.maxUserPerStore} tài khoản/cửa hàng`,'Báo cáo doanh thu cơ bản','Hỗ trợ qua Email']; uiThemeColor = 'blue'; }
          else if (plan.name === 'Chuyên Nghiệp') { uiFeatures = [`Quản lý ${plan.maxStore} cửa hàng`,`${plan.maxUserPerStore} tài khoản/cửa hàng`,'Báo cáo doanh thu nâng cao','Tích hợp API (Shopee, Lazada)','Hỗ trợ ưu tiên 24/7']; if (plan.discount > 0) { uiIsPopular = true; uiThemeColor = 'purple'; } }
          else if (plan.name === 'Doanh Nghiệp') { uiFeatures = [`Quản lý ${plan.maxStore} cửa hàng`,`${plan.maxUserPerStore} tài khoản/cửa hàng`,'Tùy chỉnh tính năng','Server riêng & Bảo mật cao','Hỗ trợ chuyên dụng']; uiThemeColor = 'orange'; }
          return { ...plan, features: uiFeatures, isPopular: uiIsPopular, themeColor: uiThemeColor };
        });
      })
    );
  }

  /**
   * === LẤY LỊCH SỬ PHÂN TRANG ===
   */
  getLicenseHistory(page: number, size: number, searchTerm?: string): Observable<PagedResponse<LicenseHistoryEntry>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('search', searchTerm.trim());
    }

    // 1. Mong đợi cấu trúc ApiResponse lồng nhau
    return this.apiService.get<ApiResponse<ApiPagedData<any>>>(this.historyApiUrl, params).pipe(
      map(response => {
        // 2. Lấy phần 'data' bên trong ApiResponse
        const apiPagedData = response.data;

        // 3. Map dữ liệu thô từ 'content' sang 'LicenseHistoryEntry'
        const mappedContent: LicenseHistoryEntry[] = apiPagedData.content.map(item => ({
          id: item.id,
          packageCode: `ID_${item.licensePackageId}`, // Tạm dùng ID
          packageName: item.packageName ?? 'N/A', // Lấy tên nếu có, nếu không thì 'N/A'
          purchaseDate: item.createdDate, // Map từ createdDate
          amountPaid: item.packagePrice ?? 0, // Lấy giá nếu có, nếu không thì 0
          userId: item.userId,
          status: this.mapStatusToString(item.status), // Map số sang chữ
          note: item.note ?? '', // <-- MAP GHI CHÚ (nếu có)
          originalStatus: item.status, // Giữ lại status gốc nếu cần
          licensePackageId: item.licensePackageId,
          createdDate: item.createdDate,
          // (Map các trường khác nếu cần)
        }));

        // 4. Trả về cấu trúc PagedResponse phẳng cho component
        return {
          content: mappedContent,
          totalElements: apiPagedData.totalElements,
          totalPages: apiPagedData.totalPages,
          number: apiPagedData.number,
          size: apiPagedData.size,
        };
      })
    );
  }

  /**
   * Hàm helper để map status number sang string
   */
  private mapStatusToString(statusNumber: number | null | undefined): string {
    switch (statusNumber) {
      case 5: return 'COMPLETED'; // Giả sử 5 là Hoàn thành
      // TODO: Thêm các case khác nếu có (PENDING, FAILED)
      // case 1: return 'PENDING';
      // case 9: return 'FAILED';
      default: return 'UNKNOWN';
    }
  }

  /**
   * *** THÊM HÀM MỚI: CẬP NHẬT LỊCH SỬ (ADMIN) ***
   */
  updateLicenseHistory(historyId: number, data: { status: string, note: string }): Observable<any> {
    const url = `${this.historyApiUrl}/${historyId}`;

    // TODO: Bạn có thể cần chuyển đổi 'status' string (COMPLETED)
    // về dạng số (5) trước khi gửi cho API nếu API yêu cầu
    // const payload = {
    //   status: this.mapStatusToNumber(data.status),
    //   note: data.note
    // };

    // Hiện tại, gửi thẳng data nhận được từ form
    return this.apiService.put<any>(url, data);
  }

  deleteLicenseHistory(historyId: number): Observable<void> {
    return this.apiService.delete<void>(`${this.historyApiUrl}/${historyId}`);
  }
  createQrCode(price: number, content: string): Observable<QrResponse> {
    const payload = { price, content };
    return this.apiService.post<QrResponse>(`${this.apiUrl}/qr`, payload);
  }
  saveLicenseHistory(packageId: number): Observable<HistoryResponse> {
    const payload: HistoryRequest = { licensePackageId: packageId };
    return this.apiService.post<HistoryResponse>(this.historyApiUrl, payload);
  }

  // --- 3. ĐÃ XÓA checkLicenseStatus() ---

  /**
   * 4. API MỚI ĐỂ LẤY USAGE (THAY THẾ CHO CHECK)
   * Gọi API để lấy thông tin sử dụng (store/user) hiện tại.
   * Lưu lại để trang Purchase License có thể so sánh.
   */
  fetchCurrentUsage(): Observable<CurrentUsage> {
    return this.apiService.get<CurrentUsage>(this.currentCheck).pipe(
      tap(response => {
        // Lưu lại thông tin usage
        this.currentUsageSubject.next(response);
      })
      // Lỗi (bao gồm SS004) sẽ được tự động throw về component
    );
  }

  getStoredUsage(): CurrentUsage | null {
    return this.currentUsageSubject.getValue();
  }



}
