// src/app/core/services/license.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

// === THAY ĐỔI 1: Định nghĩa cấu trúc phản hồi API ===
// (Để khớp với JSON bạn cung cấp)
export interface ApiResponse<T> {
  result: string;
  message: string;
  errorCode: string;
  data: T; // Dữ liệu chúng ta cần nằm trong này
}

/**
 * Định nghĩa cấu trúc cho một gói License.
 */
export interface LicensePlan {
  id: number;
  name: string;
  description: string | null; // API có thể trả về null
  maxStore: number;
  maxUserPerStore: number;
  price: number;
  discount: number;
  durationDays: number;
  isPopular?: boolean; // Trường này ta tự thêm vào
  features?: string[]; // Trường này ta tự thêm vào
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiService = inject(ApiService);
  private apiUrl = '/license-packages'; // Endpoint đã đúng

  constructor() { }

  /**
   * Lấy danh sách các gói License từ API và làm giàu dữ liệu cho UI
   */
  getLicensePlans(): Observable<LicensePlan[]> {

    // === THAY ĐỔI 2: Đổi kiểu mong đợi ===
    // Thay vì mong đợi LicensePlan[], giờ ta mong đợi ApiResponse<LicensePlan[]>
    return this.apiService.get<ApiResponse<LicensePlan[]>>(this.apiUrl).pipe(

      // === THAY ĐỔI 3: Cập nhật hàm map() ===
      map(response => {
        // 'response' là object { result: "...", data: [...] }

        // 1. Lấy mảng 'data' từ bên trong response
        const apiPlans = response.data;

        // 2. Lặp qua mảng apiPlans (logic "làm giàu" dữ liệu)
        return apiPlans.map(plan => {

          let uiFeatures: string[] = [];
          let uiIsPopular = false;

          // Logic để thêm trường UI (features, isPopular)
          // Cập nhật logic này dựa trên tên gói "TRIAL"
          if (plan.name === 'TRIAL') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`,
              `${plan.maxUserPerStore} tài khoản/cửa hàng`,
              `Dùng thử ${plan.durationDays} ngày`,
              'Hỗ trợ cơ bản'
            ];
            // Vì chỉ có 1 gói, ta làm nó nổi bật luôn
            uiIsPopular = true;
          }
          // ... (Thêm else if cho các gói khác nếu có)
          // else if (plan.name === 'CHUYEN_NGHIEP') { ... }

          // 3. Trả về object đã được "làm giàu"
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
