// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs'; // Import throwError and 'of' if using Option 2 below
import { map, tap } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
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
  private licenseCheckUrl = '/license/check';
  private currentUsageUrl = '/api/usage'; // Example URL

  private currentUsageSubject = new BehaviorSubject<CurrentUsage | null>(null);
  currentUsage$ = this.currentUsageSubject.asObservable();


  constructor() { }

  // --- Methods ---
  getLicensePlans(): Observable<LicensePlan[]> {
    // Note: Assuming ApiService now handles token automatically via interceptor
    // If not, you'd need to add headers here like in checkLicenseStatus
    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(
      map(response => {
        const apiPlans = response.data;
        return apiPlans.map((plan: LicensePlan) => {
          let uiFeatures: string[] = [];
          let uiIsPopular = false;
          let uiThemeColor: LicensePlan['themeColor'] = 'blue';
          // (Mapping logic...)
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
    // Note: Assuming ApiService now handles token automatically via interceptor
    const payload = { price, content };
    return this.apiService.post<QrResponse>(`${this.apiUrl}/qr`, payload);
  }

  saveLicenseHistory(packageId: number): Observable<HistoryResponse> {
    // Note: Assuming ApiService now handles token automatically via interceptor
    const payload: HistoryRequest = { license_package_id: packageId };
    return this.apiService.post<HistoryResponse>(this.historyApiUrl, payload);
  }

  /**
   * Calls API to check the current user's license status.
   * Assumes ApiService automatically adds the token header via an interceptor.
   * Stores usage details if expired.
   */
  checkLicenseStatus(): Observable<LicenseStatus> {
    // No need to manually get token or set headers if ApiService handles it
    return this.apiService.get<LicenseStatus>(this.licenseCheckUrl).pipe(
      tap(response => {
        // (Logic to store usage details remains the same)
        if (response.status === 'expired') {
          this.currentUsageSubject.next({ storeCount: response.currentStoreCount ?? 0, userCount: response.currentUserCount ?? 0, stores: response.stores ?? [], users: response.users ?? [] });
        } else {
          this.currentUsageSubject.next(null);
        }
      })
    );
  }

  getStoredUsage(): CurrentUsage | null {
    return this.currentUsageSubject.getValue();
  }
}
