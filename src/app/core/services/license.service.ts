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
  themeColor?: 'green' | 'blue' | 'purple' | 'orange'; // <-- Thuộc tính gán màu
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  // Sửa lại endpoint từ file cũ, file bạn cung cấp bị thiếu /api
  private apiUrl = '/license-packages';

  constructor() { }

  getLicensePlans(): Observable<LicensePlan[]> {

    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(

      map(response => {

        // Lấy mảng data từ response
        const apiPlans = response.data;

        return apiPlans.map(plan => {

          let uiFeatures: string[] = [];
          let uiIsPopular = false;
          let uiThemeColor: LicensePlan['themeColor'] = 'blue'; // Màu mặc định

          // 1. Gói TRIAL
          if (plan.name === 'TRIAL') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 3
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 10
              `Dùng thử ${plan.durationDays} ngày`,
              'Hỗ trợ cơ bản'
            ];
            uiThemeColor = 'green'; // Gán màu xanh lá
          }

          // 2. Gói CÁ NHÂN
          else if (plan.name === 'Cá Nhân') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 1
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 5
              'Báo cáo doanh thu cơ bản',
              'Hỗ trợ qua Email'
            ];
            uiThemeColor = 'blue'; // Gán màu xanh dương
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
              uiThemeColor = 'purple'; // Gán màu tím cho gói nổi bật
            }
          }

          // 4. Gói DOANH NGHIỆP
          else if (plan.name === 'Doanh Nghiệp') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`, // 999
              `${plan.maxUserPerStore} tài khoản/cửa hàng`, // 999
              'Tùy chỉnh tính năng',
              'Server riêng & Bảo mật cao',
              'Hỗ trợ chuyên dụng'
            ];
            uiThemeColor = 'orange'; // Gán màu cam
          }

          // Trả về object đã được "làm giàu"
          return {
            ...plan,
            features: uiFeatures,
            isPopular: uiIsPopular,
            themeColor: uiThemeColor // Thêm màu vào object trả về
          };
        });
      })
    );
  }
}
