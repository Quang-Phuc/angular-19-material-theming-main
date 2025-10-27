// purchase-license.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Services
import { LicenseService, LicensePlan } from '../../../core/services/license.service'; // Chỉnh đường dẫn
import { NotificationService } from '../../../core/services/notification.service';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips'; // Dùng cho tag "Phổ biến"

@Component({
  selector: 'app-purchase-license',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe, // Thêm CurrencyPipe vào imports
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './purchase-license.component.html',
  styleUrl: './purchase-license.component.scss'
})
export class PurchaseLicenseComponent implements OnInit {

  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  licensePlans: LicensePlan[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadPlans();
  }

  // ... (các hàm khác)

  loadPlans(): void {
    this.isLoading = true;
    this.licenseService.getLicensePlans().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (plans) => {
        // === THÊM DÒNG NÀY ĐỂ DEBUG ===
        console.log('Tải gói thành công:', plans);

        this.licensePlans = plans;
      },
      error: (err) => {
        // === THÊM DÒNG NÀY ĐỂ DEBUG ===
        console.error('Lỗi khi tải gói:', err);

        this.notification.showError('Không thể tải danh sách gói. Vui lòng thử lại.');
      }
    });
  }

// ... (các hàm khác)

  /**
   * Tính giá cuối cùng sau khi đã giảm
   */
  calculateFinalPrice(plan: LicensePlan): number {
    if (plan.discount > 0) {
      return plan.price * (1 - (plan.discount / 100));
    }
    return plan.price;
  }

  /**
   * Xử lý khi người dùng chọn mua 1 gói
   */
  onSelectPlan(plan: LicensePlan): void {
    // 1. Sử dụng showSuccess thay vì showInfo
    this.notification.showSuccess(`Bạn đã chọn: ${plan.name}. Đang chuyển đến trang thanh toán...`);

    // 2. Kích hoạt điều hướng đến trang thanh toán và truyền ID của gói
    this.router.navigate(['/payment'], { queryParams: { planId: plan.id } });

    // 3. Xóa console.log
    // console.log('Selected plan:', plan);
  }
}
