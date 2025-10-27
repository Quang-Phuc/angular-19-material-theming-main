// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

// Interface ApiResponse (Giữ nguyên)
export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T;
}

// Interface LicensePlan (Giữ nguyên)
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
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private apiUrl = '/license-packages'; // Endpoint (Giữ nguyên)

  constructor() { }

  getLicensePlans(): Observable<LicensePlan[]> {

    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(

      map(response => {

        const apiPlans = response.data;

        // === CẬP NHẬT LOGIC: Xử lý cho cả 4 gói ===
        return apiPlans.map(plan => {

          let uiFeatures: string[] = [];
          let uiIsPopular = false;

          // 1. Gói TRIAL
          if (plan.name === 'TRIAL') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 3
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 10
              `Dùng thử ${plan.durationDays} ngày`,
              'Hỗ trợ cơ bản'
            ];
            // Không nên 'isPopular' nếu có gói Pro
          }

          // 2. Gói CÁ NHÂN
          else if (plan.name === 'Cá Nhân') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 1
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 5
              'Báo cáo doanh thu cơ bản',
              'Hỗ trợ qua Email'
            ];
          }

          // 3. Gói CHUYÊN NGHIỆP
          else if (plan.name === 'Chuyên Nghiệp') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 5
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 25
              'Báo cáo doanh thu nâng cao',
              'Tích hợp API (Shopee, Lazada)',
              'Hỗ trợ ưu tiên 24/7'
            ];
            // Tự động làm nổi bật gói có giảm giá
            if (plan.discount > 0) {
              uiIsPopular = true;
            }
          }

          // 4. Gói DOANH NGHIỆP
          else if (plan.name === 'Doanh Nghiệp') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 999
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 999 (Sửa lỗi trong ảnh)
              'Tùy chỉnh tính năng',
              'Server riêng & Bảo mật cao',
              'Hỗ trợ chuyên dụng'
            ];
          }

          // Trả về object đã được "làm giàu"
          return {
            ...plan,
            features: uiFeatures,
            isPopular: uiIsPopular
          };
        });
      })
    );
  }
}
