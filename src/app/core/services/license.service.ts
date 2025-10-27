// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

// === ADD EXPORT TO ALL INTERFACES ===
export interface ApiResponse<T> { // <-- Added export
  result: string;
  message: string;
  errorCode: string;
  data: T;
}

export interface LicensePlan { // <-- Added export
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

export interface UserInfo { // <-- Added export
  id: number;
  name: string;
  storeId?: number;
}

export interface StoreInfo { // <-- Added export
  id: number;
  name: string;
}

export interface LicenseStatus { // <-- Added export
  status: 'valid' | 'expired' | 'not_found';
  expiryDate?: string;
  currentStoreCount?: number;
  currentUserCount?: number;
  stores?: StoreInfo[];
  users?: UserInfo[];
}

export interface CurrentUsage { // <-- Added export
  storeCount: number;
  userCount: number;
  stores: StoreInfo[];
  users: UserInfo[];
}

export interface QrResponse { // <-- Added export
  base64Data: string;
}

export interface HistoryRequest { // <-- Added export
  license_package_id: number;
}

export interface HistoryResponse { // <-- Added export
  id: number;
}


@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private apiUrl = '/api/license-packages';
  private historyApiUrl = '/api/license-history';
  private licenseCheckUrl = '/api/license/check';
  private currentUsageUrl = '/api/usage';

  private currentUsageSubject = new BehaviorSubject<CurrentUsage | null>(null);
  currentUsage$ = this.currentUsageSubject.asObservable();


  constructor() { }

  // --- Methods ---
  getLicensePlans(): Observable<LicensePlan[]> {
    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(
      map(response => {
        const apiPlans = response.data;
        // Add type to 'plan' parameter
        return apiPlans.map((plan: LicensePlan) => { // <-- Added Type here
          let uiFeatures: string[] = [];
          let uiIsPopular = false;
          let uiThemeColor: LicensePlan['themeColor'] = 'blue';

          // (Logic remains the same)
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

  checkLicenseStatus(): Observable<LicenseStatus> {
    return this.apiService.get<LicenseStatus>(this.licenseCheckUrl).pipe(
      tap(response => {
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
