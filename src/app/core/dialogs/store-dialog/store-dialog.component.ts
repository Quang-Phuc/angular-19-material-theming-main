import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs/operators';

// Giả sử các service này đã được cung cấp ở root
import { StoreService } from '../../services/store.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-store-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './store-dialog.component.html',
  styleUrl: './store-dialog.component.scss'
})
export class StoreDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private notification = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<StoreDialogComponent>);

  storeForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.isEditMode = !!data; // Nếu có data truyền vào, là chế độ Edit

    // === THAY ĐỔI FORMGROUP Ở ĐÂY ===
    this.storeForm = this.fb.group({
      storeName: ['', [Validators.required]],
      storeAddress: [''], // Thêm địa chỉ (không bắt buộc)
      notes: ['']          // Thêm ghi chú (không bắt buộc)
    });
    // Đã bỏ userFullName
  }

  ngOnInit(): void {
    if (this.isEditMode) {
      // Patch dữ liệu từ 'row' vào form
      this.storeForm.patchValue(this.data);
    }
  }

  onSave(): void {
    this.storeForm.markAllAsTouched();
    if (this.storeForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const payload = this.storeForm.value;

    const request$ = this.isEditMode
      ? this.storeService.updateStore(this.data.storeId, payload)
      : this.storeService.createStore(payload);

    request$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        const message = this.isEditMode
          ? 'Cập nhật tiệm thành công!'
          : 'Thêm tiệm mới thành công!';
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
