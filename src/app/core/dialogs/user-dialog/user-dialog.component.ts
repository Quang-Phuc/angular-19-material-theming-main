// /core/dialogs/user-dialog/user-dialog.component.ts (Tệp mới)

import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select'; // Thêm
import { MatIconModule } from '@angular/material/icon'; // Thêm
import { finalize } from 'rxjs/operators';

// Import service
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
// (StoreService không cần thiết vì ta sẽ nhận list từ user-list.component)

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressBarModule,
    MatSelectModule, MatIconModule // Thêm
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notification = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<UserDialogComponent>);

  userForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSendingReset = false; // Trạng thái cho nút quên mật khẩu
  storeList: any[] = []; // Nơi nhận danh sách tiệm

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.isEditMode = !!data.row; // Kiểm tra xem 'row' có tồn tại không
    this.storeList = data.storeList || []; // Nhận danh sách tiệm

    this.userForm = this.fb.group({
      fullName: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Sẽ thêm validator trong ngOnInit
      storeId: [null, [Validators.required]] // Thêm trường chọn tiệm
    });
  }

  ngOnInit(): void {
    const passwordControl = this.userForm.get('password');

    if (this.isEditMode) {
      // Chế độ Sửa: Patch dữ liệu và làm mật khẩu không bắt buộc
      const userData = this.data.row;
      this.userForm.patchValue({
        ...userData,
        storeId: userData.store?.storeId // Lấy storeId từ object lồng nhau
      });

      passwordControl?.setValidators(null); // Không bắt buộc
    } else {
      // Chế độ Thêm: Mật khẩu là bắt buộc
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    passwordControl?.updateValueAndValidity();
  }

  onSave(): void {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const payload = this.userForm.value;

    const request$ = this.isEditMode
      ? this.userService.updateUser(this.data.row.userId, payload)
      : this.userService.createUser(payload);

    request$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        const message = this.isEditMode
          ? 'Cập nhật người dùng thành công!'
          : 'Thêm người dùng mới thành công!';
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

  /**
   * === HÀM MỚI: GỬI QUÊN MẬT KHẨU ===
   */
  onForgotPassword(): void {
    const emailControl = this.userForm.get('email');
    if (!emailControl?.valid) {
      this.notification.showError('Vui lòng nhập một địa chỉ email hợp lệ.');
      emailControl?.markAsTouched();
      return;
    }

    if (this.isSendingReset) return;
    this.isSendingReset = true;

    // Giả sử UserService có hàm sendPasswordReset
    this.userService.sendPasswordReset(emailControl.value).pipe(
      finalize(() => this.isSendingReset = false)
    ).subscribe({
      next: () => {
        this.notification.showSuccess('Đã gửi email đặt lại mật khẩu thành công!');
      },
      error: (err: Error) => {
        this.notification.showError(err.message || 'Gửi email thất bại.');
      }
    });
  }
}
