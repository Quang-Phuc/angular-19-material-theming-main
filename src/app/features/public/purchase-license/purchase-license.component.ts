// purchase-license.component.ts

// 1. IMPORT THÊM CÁC MODULES VÀ LOGIC MỚI
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, of } from 'rxjs'; // Thêm 'of' để giả lập API
import { delay } from 'rxjs/operators';
import * as AOS from 'aos';

// Services
import { LicenseService, LicensePlan } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

// 2. THÊM CÁC MODULES CHO STEPPER VÀ FORM
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms'; // Cần cho ngModel
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio'; // Thêm cho thanh toán (nếu cần)

// 3. ĐỊNH NGHĨA CÁC INTERFACE (TỪ FILE REACT)
interface LicenseRequestPayload {
  packageId: number; // Dùng 'number' thay vì 'string'
  amount: number;
  transferContent: string;
}

interface LicenseResponse {
  requestId: string;
  userId: number;
}

// Thông tin ngân hàng (từ file React)
const BANK_INFO = {
  bankName: 'MB Bank (Ngân hàng Quân đội)',
  accountNumber: '0987654321',
  accountName: 'CONG TY ABC',
};

@Component({
  selector: 'app-purchase-license',
  standalone: true,
  // 4. THÊM CÁC MODULES MỚI VÀO IMPORTS
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule, // Thêm
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatStepperModule, // Thêm
    MatInputModule, // Thêm
    MatFormFieldModule, // Thêm
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

  // --- 5. STATE MỚI (TỪ VIEWMODEL REACT) ---
  activeStep = 0; // 0 = Chọn gói, 1 = Thanh toán, 2 = Hoàn tất
  selectedPackage: LicensePlan | null = null;
  paymentDetails: {
    transferContent: string;
    amount: number;
    requestId: string
  } | null = null;
  transferContent = ''; // Nội dung chuyển khoản
  qrImageUrl: string | null = null; // Link ảnh QR

  // BiếnBANK_INFO (hardcode)
  bankInfo = BANK_INFO;

  // Trạng thái loading
  isSendingRequest = false;

  // --- Methods (Giữ nguyên) ---
  ngOnInit(): void {
    AOS.init({ duration: 600, once: true, offset: 50 });
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

  // --- 6. LOGIC MỚI (CHUYỂN TỪ REACT VIEWMODEL) ---

  /**
   * Xử lý khi người dùng chọn 1 gói (onSelectPlan cũ)
   * (Đã cập nhật logic 3 bước)
   */
  handleSelectPackage(plan: LicensePlan): void {
    this.selectedPackage = plan;
    const finalPrice = this.calculateFinalPrice(plan);

    // Gói TRIAL (Miễn phí)
    if (finalPrice === 0) {
      this.handleSelectTrial(plan);
    }
    // Gói trả phí
    else {
      // Tạo nội dung chuyển khoản
      // (Giả sử bạn có user ID, nếu không hãy dùng 1 mã ngẫu nhiên)
      const userId = 'USER_123'; // <-- TODO: Lấy user ID thật
      this.transferContent = `MUA ${plan.id} ${userId} ${Date.now()}`;

      // Tạo link QR
      this.qrImageUrl = this.generateVietQRUrl(finalPrice, this.transferContent);

      // Chuyển sang bước 2
      this.activeStep = 1;
    }
  }

  /**
   * Xử lý riêng cho gói TRIAL
   */
  handleSelectTrial(plan: LicensePlan): void {
    this.isSendingRequest = true;
    const trialContent = `TRIAL_${plan.id}_${Date.now()}`;

    const payload: LicenseRequestPayload = {
      packageId: plan.id,
      amount: 0,
      transferContent: trialContent,
    };

    // Lưu tạm thông tin
    this.paymentDetails = {
      transferContent: trialContent,
      amount: 0,
      requestId: 'TRIAL_REQUEST'
    };

    // --- TODO: GỌI API THẬT Ở ĐÂY ---
    // this.licenseService.createLicenseRequest(payload).subscribe({ ... })

    // Giả lập gọi API thành công sau 1 giây
    of({ requestId: 'FAKE_TRIAL_ID_123', userId: 123 }).pipe(
      delay(1000),
      finalize(() => this.isSendingRequest = false)
    ).subscribe({
      next: (response) => {
        this.notification.showSuccess('Đã đăng ký gói Trial thành công!');
        this.paymentDetails!.requestId = response.requestId;
        this.activeStep = 2; // Chuyển thẳng đến bước Hoàn tất
      },
      error: (err) => {
        this.notification.showError('Đăng ký gói Trial thất bại. Vui lòng thử lại.');
      }
    });
  }

  /**
   * Xử lý khi người dùng xác nhận đã chuyển khoản (Bước 2)
   */
  handleTransferConfirmed(): void {
    if (!this.selectedPackage || !this.transferContent) return;

    this.isSendingRequest = true;
    const finalPrice = this.calculateFinalPrice(this.selectedPackage);

    const payload: LicenseRequestPayload = {
      packageId: this.selectedPackage.id,
      amount: finalPrice,
      transferContent: this.transferContent,
    };

    // Lưu thông tin thanh toán
    this.paymentDetails = {
      transferContent: this.transferContent,
      amount: finalPrice,
      requestId: 'PENDING_REQUEST'
    };

    // --- TODO: GỌI API THẬT Ở ĐÂY ---
    // this.licenseService.createLicenseRequest(payload).subscribe({ ... })

    // Giả lập gọi API thành công sau 1.5 giây
    of({ requestId: 'FAKE_PAYMENT_ID_456', userId: 123 }).pipe(
      delay(1500),
      finalize(() => this.isSendingRequest = false)
    ).subscribe({
      next: (response) => {
        this.notification.showSuccess('Yêu cầu thanh toán đã được gửi đi!');
        this.paymentDetails!.requestId = response.requestId;
        this.activeStep = 2; // Chuyển đến bước Hoàn tất
      },
      error: (err) => {
        this.notification.showError('Gửi yêu cầu thất bại. Vui lòng thử lại.');
      }
    });
  }

  /**
   * Quay lại bước trước
   */
  prevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  /**
   * Reset flow, quay về trang chủ (hoặc load lại)
   */
  resetFlow(): void {
    // Quay về trang chủ (hoặc dashboard)
    this.router.navigate(['/']);

    // Hoặc reset lại từ đầu
    // this.activeStep = 0;
    // this.selectedPackage = null;
    // this.paymentDetails = null;
    // this.transferContent = '';
    // this.qrImageUrl = null;
    // this.loadPlans();
  }

  /**
   * Tạo link VietQR (từ file React)
   */
  generateVietQRUrl(amount: number, content: string): string {
    const info = encodeURIComponent(content);
    const name = encodeURIComponent(this.bankInfo.accountName);
    // (Đây là template VietQR, bạn có thể cần chỉnh sửa)
    return `https://api.vietqr.io/image/${this.bankInfo.accountNumber}?accountName=${name}&amount=${amount}&addInfo=${info}`;
  }
}
