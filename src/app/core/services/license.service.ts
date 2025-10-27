import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <-- 1. Import HttpClient
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // <-- 2. Import 'map' operator

/**
 * Định nghĩa cấu trúc cho một gói License.
 * Dựa trên các trường bạn cung cấp + các trường cho UI.
 */
export interface LicensePlan {
  id: number;
  name: string;
  description: string;
  maxStore: number;
  maxUserPerStore: number;
  price: number;
  discount: number;
  durationDays: number;
  isPopular?: boolean; // <-- Vẫn giữ làm trường tùy chọn
  features?: string[]; // <-- Vẫn giữ làm trường tùy chọn
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private http = inject(HttpClient); // <-- 3. Inject HttpClient

  // 4. Định nghĩa URL API (sử dụng URL tương đối)
  private apiUrl = '/api/auth/license-package';

  constructor() { }

  /**
   * Lấy danh sách các gói License từ API và làm giàu dữ liệu cho UI
   */
  getLicensePlans(): Observable<LicensePlan[]> {

    // 5. Gọi API thật bằng http.get
    // API trả về mảng LicensePlan (chưa có 'features' và 'isPopular')
    return this.http.get<LicensePlan[]>(this.apiUrl).pipe(

      // 6. Dùng 'map' để biến đổi dữ liệu trả về
      map(apiPlans => {

        // Lặp qua từng plan nhận được từ API
        return apiPlans.map(plan => {

          let uiFeatures: string[] = [];
          let uiIsPopular = false;

          // === LOGIC LÀM GIÀU DỮ LIỆU ===
          // Thêm 'features' và 'isPopular' dựa trên 'name' (hoặc 'id')
          // Bạn có thể tùy chỉnh logic này

          if (plan.name === 'Cá Nhân') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`,
              `${plan.maxUserPerStore} tài khoản nhân viên`,
              'Báo cáo cơ bản',
              'Hỗ trợ qua Email'
            ];
          }
          else if (plan.name === 'Chuyên Nghiệp') {
            uiFeatures = [
              `Quản lý ${plan.maxStore} cửa hàng`,
              `${plan.maxUserPerStore} tài khoản/cửa hàng`,
              'Báo cáo nâng cao',
              'Tích hợp API',
              'Hỗ trợ ưu tiên 24/7'
            ];
            uiIsPopular = true; // <-- Đánh dấu gói này là "Phổ biến"
          }
          else if (plan.name === 'Doanh Nghiệp') {
            uiFeatures = [
              'Không giới hạn cửa hàng',
              'Không giới hạn nhân viên',
              'Tùy chỉnh tính năng',
              'Server riêng',
              'Hỗ trợ chuyên dụng'
            ];
          }

          // 7. Trả về object mới đã bao gồm dữ liệu từ API và dữ liệu UI
          return {
            ...plan, // Dữ liệu gốc từ API
            features: uiFeatures, // Dữ liệu UI đã thêm
            isPopular: uiIsPopular // Dữ liệu UI đã thêm
          };
        });
      })
    );
  }
}
