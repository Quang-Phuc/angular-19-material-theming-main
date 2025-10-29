// src/app/core/dialogs/license-package-dialog/license-package-dialog.component.ts (TỆP MỚI)

import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';

// Imports nội bộ
import { LicensePackage } from '../../models/license-package.model';
import { LicensePackageService } from '../../services/license-package.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-license-package-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressBarModule, MatIconModule
  ],
  templateUrl: './license-package-dialog.component.html',
  styleUrl: './license-package-dialog.component.scss'
})
export class LicensePackageDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private packageService = inject(LicensePackageService);
  private notification = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<LicensePackageDialogComponent>);

  packageForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: LicensePackage) {
    this.isEditMode = !!data;

    this.packageForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      maxStore: [null, [Validators.min(0)]],
      maxUserPerStore: [null, [Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      durationDays: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode) {
      this.packageForm.patchValue(this.data);
    }
  }

  onSave(): void {
    this.packageForm.markAllAsTouched();
    if (this.packageForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const payload = this.packageForm.value;

    // Xử lý các giá trị null/rỗng thành null
    // (API có thể cần điều này cho các trường Integer/Double tùy chọn)
    const cleanPayload: Partial<LicensePackage> = {
      ...payload,
      description: payload.description || null,
      maxStore: payload.maxStore || null,
      maxUserPerStore: payload.maxUserPerStore || null,
      discount: payload.discount || 0,
    };

    const request$ = this.isEditMode
      ? this.packageService.updateLicensePackage(this.data.id, cleanPayload)
      : this.packageService.createLicensePackage(cleanPayload);

    request$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        const message = this.isEditMode
          ? 'Cập nhật gói thành công!'
          : 'Thêm gói mới thành công!';
        this.notification.showSuccess(message);
        this.dialogRef.close(true); // Trả về 'true' để list component biết cần refresh
      },
      error: (error: Error) => {
        this.notification.showError(error.message || 'Đã có lỗi xảy ra');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
