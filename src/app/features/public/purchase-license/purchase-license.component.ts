// purchase-license.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs'; // Bỏ 'of' và 'delay'
import * as AOS from 'aos';

// === 1. CẬP NHẬT IMPORT (THÊM INTERFACE MỚI) ===
import { LicenseService, LicensePlan, QrResponse, HistoryResponse } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

// Modules (Giữ nguyên)
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// (Bỏ các interface giả lập)
const BANK_INFO = {
  bankName: 'MB Bank (Ngân hàng Quân đội)',
  accountNumber: '0987654321',
  accountName: 'CONG TY ABC',
};

@Component({
  selector: 'app-purchase-license',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, FormsModule, MatCardModule, MatButtonModule,
    MatListModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule,
    MatDividerModule, MatStepperModule, MatInputModule, MatFormFieldModule,
  ],
  templateUrl: './purchase-license.component.html',
  styleUrl: './purchase-license.component.scss'
})
export class PurchaseLicenseComponent implements OnInit {

  // --- Services (Giữ nguyên) ---
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // --- State (Giữ nguyên) ---
  licensePlans: LicensePlan[] = [];
  isLoading = false;
  activeStep = 0;
  selectedPackage: LicensePlan | null = null;
  paymentDetails: {
    transferContent: string;
    amount: number;
    requestId: string
  } | null = null;
  transferContent = '';
  bankInfo = BANK_INFO;
  isSendingRequest = false;
  qrCodeBase64: string | null = null;
  isFetchingQr = false;

  // --- Methods (Giữ nguyên) ---
  ngOnInit(): void {
    AOS.init({ duration: 600, once: true, offset: 50 });
    this.loadPlans(); // <-- GỌI API LẤY GÓI (BƯỚC 1)
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
        this.cdr.markForCheck();
        setTimeout(() => { AOS.refresh(); }, 100);
      },
      error: (err) => {
        this.notification.showError('Không thể tải danh sách gói. Vui lòng thử lại.');
        this.cdr.markForCheck();
      }
    });
  }

  calculateFinalPrice(plan: LicensePlan): number {
    if (plan.discount > 0) {
      return plan.price * (1 - (plan.discount / 100));
    }
    return plan.price;
  }

  handleSelectPackage(plan: LicensePlan): void {
    this.selectedPackage = plan;
    const finalPrice = this.calculateFinalPrice(plan);

    if (finalPrice === 0) {
      this.handleSelectTrial(plan);
    }
    else {
      const userId = 'USER_123';
      this.transferContent = `MUA ${plan.id} ${userId} ${Date.now()}`;
      this.isFetchingQr = true;
      this.qrCodeBase64 = null;

      // GỌI API QR (BƯỚC 2)
      this.licenseService.createQrCode(finalPrice, this.transferContent).subscribe({
        next: (response) => {
          this.qrCodeBase64 = response.base64Data;
          this.isFetchingQr = false;
          this.activeStep = 1;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.notification.showError('Không thể tạo mã QR. Vui lòng thử lại.');
          this.isFetchingQr = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  // --- CẬP NHẬT LOGIC (handleSelectTrial) ---
  handleSelectTrial(plan: LicensePlan): void {
    this.isSendingRequest = true;

    // Chuẩn bị data cho Bước 3
    this.paymentDetails = {
      transferContent: `TRIAL_${plan.id}`,
      amount: 0,
      requestId: 'TRIAL_REQUEST' // Sẽ được cập nhật
    };

    // === GỌI API THẬT (BƯỚC 3) ===
    this.licenseService.saveLicenseHistory(plan.id).pipe(
      finalize(() => {
        this.isSendingRequest = false;
        this.cdr.markForCheck(); // Kích hoạt UI
      })
    ).subscribe({
      next: (response: HistoryResponse) => {
        this.notification.showSuccess('Đã đăng ký gói Trial thành công!');
        this.paymentDetails!.requestId = String(response.id); // Lấy ID thật từ API
        this.activeStep = 2; // Chuyển đến bước Hoàn tất
      },
      error: (err) => {
        // Lấy lỗi từ interceptor hoặc ApiService
        const message = err?.error?.message || err?.message || 'Đăng ký gói Trial thất bại.';
        this.notification.showError(message);
      }
    });
  }

  // --- CẬP NHẬT LOGIC (handleTransferConfirmed) ---
  handleTransferConfirmed(): void {
    if (!this.selectedPackage || !this.transferContent) return;

    this.isSendingRequest = true;
    const finalPrice = this.calculateFinalPrice(this.selectedPackage);

    // Chuẩn bị data cho Bước 3
    this.paymentDetails = {
      transferContent: this.transferContent,
      amount: finalPrice,
      requestId: 'PENDING_REQUEST' // Sẽ được cập nhật
    };

    // === GỌI API THẬT (BƯỚC 3) ===
    this.licenseService.saveLicenseHistory(this.selectedPackage.id).pipe(
      finalize(() => {
        this.isSendingRequest = false;
        this.cdr.markForCheck(); // Kích hoạt UI
      })
    ).subscribe({
      next: (response: HistoryResponse) => {
        this.notification.showSuccess('Yêu cầu thanh toán đã được gửi đi!');
        this.paymentDetails!.requestId = String(response.id); // Lấy ID thật từ API
        this.activeStep = 2; // Chuyển đến bước Hoàn tất
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Gửi yêu cầu thất bại.';
        this.notification.showError(message);
      }
    });
  }

  prevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  resetFlow(): void {
    this.router.navigate(['/']);
  }
}
