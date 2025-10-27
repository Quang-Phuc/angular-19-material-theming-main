// purchase-license.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import * as AOS from 'aos';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// *** Adjust path if your dialog component is elsewhere ***
import { DowngradeSelectionDialogComponent } from '../../../core/dialogs/downgrade-selection-dialog/downgrade-selection-dialog.component';

// *** Ensure ALL interfaces are correctly imported ***
import { LicenseService, LicensePlan, QrResponse, HistoryResponse, CurrentUsage } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

// Modules
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
    MatDialogModule
  ],
  templateUrl: './purchase-license.component.html',
  styleUrl: './purchase-license.component.scss'
})
export class PurchaseLicenseComponent implements OnInit {

  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  licensePlans: LicensePlan[] = [];
  isLoading = false;
  activeStep = 0;
  selectedPackage: LicensePlan | null = null;
  paymentDetails: { transferContent: string; amount: number; requestId: string } | null = null;
  transferContent = '';
  bankInfo = BANK_INFO; // Make bankInfo public
  isSendingRequest = false;
  qrCodeBase64: string | null = null;
  isFetchingQr = false;
  currentUsage: CurrentUsage | null = null;


  ngOnInit(): void {
    AOS.init({ duration: 600, once: true, offset: 50 });
    this.currentUsage = this.licenseService.getStoredUsage();
    this.loadPlans();
  }

  loadPlans(): void { /* ... (no changes) ... */ }

  // *** Ensure calculateFinalPrice ALWAYS returns a number ***
  calculateFinalPrice(plan: LicensePlan | null): number { // Allow null input
    if (!plan) return 0; // Return 0 if plan is null
    if (plan.discount > 0) {
      return plan.price * (1 - (plan.discount / 100));
    }
    return plan.price; // Ensure return here
  }

  handleSelectPackage(plan: LicensePlan): void {
    this.selectedPackage = plan;
    const finalPrice = this.calculateFinalPrice(plan);

    if (finalPrice === 0) {
      this.handleSelectTrial(plan);
      return;
    }

    const usage = this.currentUsage;

    if (usage && (plan.maxStore < usage.storeCount || plan.maxUserPerStore < usage.userCount)) {
      this.openDowngradeSelectionDialog(plan, usage);
    } else {
      this.proceedToPaymentStep(plan);
    }
  }

  openDowngradeSelectionDialog(plan: LicensePlan, usage: CurrentUsage): void {
    const dialogRef = this.dialog.open(DowngradeSelectionDialogComponent, {
      width: '600px',
      data: {
        newPackageLimits: { maxStore: plan.maxStore, maxUserPerStore: plan.maxUserPerStore },
        currentUsage: usage
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Downgrade confirmed. Selected:', result);
        this.proceedToPaymentStep(plan);
      } else {
        this.selectedPackage = null;
        // *** REMOVE showInfo call ***
        // this.notification.showInfo('Đã hủy chọn gói.');
        this.cdr.markForCheck();
      }
    });
  }

  proceedToPaymentStep(plan: LicensePlan): void {
    const finalPrice = this.calculateFinalPrice(plan);
    const userId = 'USER_123';
    this.transferContent = `MUA ${plan.id} ${userId} ${Date.now()}`;

    this.isFetchingQr = true;
    this.qrCodeBase64 = null;
    this.cdr.markForCheck();

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

  handleSelectTrial(plan: LicensePlan): void { /* ... (no changes) ... */ }
  handleTransferConfirmed(): void { /* ... (no changes) ... */ }
  prevStep(): void { /* ... (no changes) ... */ }
  resetFlow(): void { /* ... (no changes) ... */ }

}
