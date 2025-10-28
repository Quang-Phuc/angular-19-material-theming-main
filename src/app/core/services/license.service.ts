// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs'; // Đã xóa throwError, of
import { map, tap } from 'rxjs/operators';
// import { HttpHeaders } from '@angular/common/http'; // Đã xóa
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

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
  license_package_id: number;
}
export interface HistoryResponse {
  id: number;
}


@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private apiUrl = '/license-packages';
  private historyApiUrl = '/license-history';
  // private licenseCheckUrl = '/license/check'; // <-- 1. ĐÃ XÓA API CŨ
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
    const payload: HistoryRequest = { license_package_id: packageId };
    return this.apiService.post<HistoryResponse>(this.historyApiUrl, payload);
  }

  // --- 3. ĐÃ XÓA checkLicenseStatus() ---

  /**
   * 4. API MỚI ĐỂ LẤY USAGE (THAY THẾ CHO CHECK)
   * Gọi API để lấy thông tin sử dụng (store/user) hiện tại.
   * Lưu lại để trang Purchase License có thể so sánh.
   */
  fetchCurrentUsage(): Observable<CurrentUsage> {
    return this.apiService.get<CurrentUsage>(this.currentUsageUrl).pipe(
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
