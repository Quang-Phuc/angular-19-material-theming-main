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
export interface LicenseHistoryEntry {
  id: number;
  packageCode: string; // Mã gói (vd: TRIAL, PRO)
  packageName: string; // Tên gói (vd: Dùng thử, Chuyên nghiệp)
  purchaseDate: string; // Ngày mua (API trả về dạng string ISO)
  amountPaid: number;   // Số tiền
  userId: number;       // ID người mua
  userName?: string;      // Tên người mua (optional)
  status: string;       // Trạng thái (vd: PENDING, COMPLETED, FAILED)
  // Thêm các trường chi tiết khác nếu API trả về
  transactionCode?: string;
  paymentMethod?: string;
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

  // (getLicensePlans, createQrCode, saveLicenseHistory giữ nguyên)
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

  getLicenseHistory(page: number, size: number, searchTerm?: string): Observable<PagedResponse<LicenseHistoryEntry>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('search', searchTerm.trim());
    }

    // SỬA LẠI: Bỏ dấu {} bao quanh params
    return this.apiService.get<PagedResponse<LicenseHistoryEntry>>(this.historyApiUrl, params); // Truyền trực tiếp params
  }

  /**
   * === 4. PHƯƠNG THỨC MỚI: XÓA LỊCH SỬ MUA ===
   * (Nếu API hỗ trợ)
   * @param historyId ID của mục lịch sử cần xóa
   */
  deleteLicenseHistory(historyId: number): Observable<void> { // Hoặc kiểu trả về khác tùy API
    return this.apiService.delete<void>(`${this.historyApiUrl}/${historyId}`);
  }

}
