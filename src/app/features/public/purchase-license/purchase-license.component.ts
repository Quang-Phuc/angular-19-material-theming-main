// purchase-license.component.ts

// 1. IMPORT THÊM ChangeDetectorRef
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Services
import { LicenseService, LicensePlan } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-purchase-license',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
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

  // 2. INJECT ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);

  licensePlans: LicensePlan[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.licenseService.getLicensePlans().pipe(
      finalize(() => {
        this.isLoading = false;
        // 4. Đánh dấu để kiểm tra lại khi finalize (quan trọng)
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (plans) => {
        console.log('Tải gói thành công:', plans); // Log này đã chạy

        this.licensePlans = plans; // Dữ liệu đã được gán

        // 3. THÊM DÒNG NÀY: Ra lệnh cho Angular "Vẽ lại giao diện!"
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi khi tải gói:', err);
        this.notification.showError('Không thể tải danh sách gói. Vui lòng thử lại.');

        // Đánh dấu kiểm tra ngay cả khi có lỗi
        this.cdr.markForCheck();
      }
    });
  }

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
    this.notification.showSuccess(`Bạn đã chọn: ${plan.name}. Đang chuyển đến trang thanh toán...`);
    this.router.navigate(['/payment'], { queryParams: { planId: plan.id } });
  }
}
