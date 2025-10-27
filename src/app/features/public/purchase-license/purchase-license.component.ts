// purchase-license.component.ts

// 1. IMPORT THÊM ChangeDetectorRef và AOS
import { Component, inject, OnInit, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos'; // <-- Import AOS

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
import { MatDividerModule } from '@angular/material/divider'; // <-- Thêm MatDividerModule

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
    MatChipsModule,
    MatDividerModule // <-- Thêm vào imports
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
    // 3. Khởi tạo AOS khi component load
    AOS.init({
      duration: 600, // Thời gian animation
      once: true, // Chỉ animate 1 lần
      offset: 50 // Bắt đầu animate sớm hơn
    });

    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.licenseService.getLicensePlans().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (plans) => {
        this.licensePlans = plans;
        this.cdr.markForCheck(); // Yêu cầu Angular cập nhật view

        // 4. SMART ANIMATION:
        // Refresh AOS sau khi view đã cập nhật
        // để nó "thấy" các card mới và bắt đầu animate
        setTimeout(() => {
          AOS.refresh();
        }, 100); // Delay 100ms để đảm bảo DOM đã render
      },
      error: (err) => {
        this.notification.showError('Không thể tải danh sách gói. Vui lòng thử lại.');
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
