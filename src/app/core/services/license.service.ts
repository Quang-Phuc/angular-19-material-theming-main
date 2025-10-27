// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

// Interface ApiResponse
export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T;
}

// Interface LicensePlan
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

// Interface cho API QR (Bước 2)
export interface QrResponse {
  base64Data: string;
  // (Cập nhật tên thuộc tính nếu API thật trả về khác)
}

// === 1. THÊM INTERFACE CHO API MỚI (BƯỚC 3) ===
export interface HistoryRequest {
  license_package_id: number;
  // (Thêm các trường khác nếu API của bạn yêu cầu, ví dụ: amount, content)
}

// Giả sử API trả về là { id: 123, status: "PENDING", ... }
export interface HistoryResponse {
  id: number;
  // (Thêm các trường khác)
}


@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private apiUrl = '/license-packages';

  // === 2. ĐỊNH NGHĨA URL API MỚI ===
  private historyApiUrl = '/license-history';

  constructor() { }

  /**
   * API 1: Lấy danh sách gói (Đã có)
   */
  getLicensePlans(): Observable<LicensePlan[]> {
    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(
      map(response => {
        // (Logic "làm giàu" dữ liệu không thay đổi)
        const apiPlans = response.data;
        return apiPlans.map(plan => {
          let uiFeatures: string[] = [];
          let uiIsPopular = false;
          let uiThemeColor: LicensePlan['themeColor'] = 'blue';

          if (plan.name === 'TRIAL') {
            uiFeatures = [ `Quản lý ${plan.maxStore} cửa hàng`, `${plan.maxUserPerStore} tài khoản/cửa hàng`, `Dùng thử ${plan.durationDays} ngày`, 'Hỗ trợ cơ bản' ];
            uiThemeColor = 'green';
          }
          else if (plan.name === 'Cá Nhân') {
            uiFeatures = [ `Quản lý ${plan.maxStore} cửa hàng`, `${plan.maxUserPerStore} tài khoản/cửa hàng`, 'Báo cáo doanh thu cơ bản', 'Hỗ trợ qua Email' ];
            uiThemeColor = 'blue';
          }
          else if (plan.name === 'Chuyên Nghiệp') {
            uiFeatures = [ `Quản lý ${plan.maxStore} cửa hàng`, `${plan.maxUserPerStore} tài khoản/cửa hàng`, 'Báo cáo doanh thu nâng cao', 'Tích hợp API (Shopee, Lazada)', 'Hỗ trợ ưu tiên 24/7' ];
            if (plan.discount > 0) {
              uiIsPopular = true;
              uiThemeColor = 'purple';
            }
          }
          else if (plan.name === 'Doanh Nghiệp') {
            uiFeatures = [ `Quản lý ${plan.maxStore} cửa hàng`, `${plan.maxUserPerStore} tài khoản/cửa hàng`, 'Tùy chỉnh tính năng', 'Server riêng & Bảo mật cao', 'Hỗ trợ chuyên dụng' ];
            uiThemeColor = 'orange';
          }

          return { ...plan, features: uiFeatures, isPopular: uiIsPopular, themeColor: uiThemeColor };
        });
      })
    );
  }

  /**
   * API 2: Lấy mã QR (Đã có)
   */
  createQrCode(price: number, content: string): Observable<QrResponse> {
    const payload = { price, content };
    return this.apiService.post<QrResponse>(`${this.apiUrl}/qr`, payload);
  }

  /**
   * API 3: Lưu lịch sử (MỚI)
   * (Gọi khi người dùng xác nhận ở Bước 2)
   */
  saveLicenseHistory(packageId: number): Observable<HistoryResponse> {
    // API của bạn chỉ yêu cầu license_package_id
    const payload: HistoryRequest = {
      license_package_id: packageId
    };

    // Nếu API của bạn cần thêm (amount, content), bạn phải thêm chúng vào đây
    // const payload = {
    //   license_package_id: packageId,
    //   amount: amount,
    //   transferContent: content
    // };

    return this.apiService.post<HistoryResponse>(this.historyApiUrl, payload);
  }
}
