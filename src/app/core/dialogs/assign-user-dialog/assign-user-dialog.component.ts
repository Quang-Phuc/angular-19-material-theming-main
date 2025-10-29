// /core/dialogs/assign-user-dialog/assign-user-dialog.component.ts (ĐÃ SỬA)

import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { HttpParams } from '@angular/common/http';

// SỬA LỖI 1: 'of' được import từ 'rxjs', không phải 'rxjs/operators'
import { finalize, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Import service
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-assign-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatButtonModule, MatProgressBarModule, MatSelectModule
  ],
  templateUrl: './assign-user-dialog.component.html',
  styleUrl: './assign-user-dialog.component.scss'
})
export class AssignUserDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notification = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<AssignUserDialogComponent>);

  assignForm: FormGroup;
  isLoading = false;
  storeId: number;
  storeName: string;

  unassignedUsers: any[] = []; // Danh sách user chưa có tiệm

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.storeId = data.storeId;
    this.storeName = data.storeName;

    this.assignForm = this.fb.group({
      userId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUnassignedUsers();
  }

  /**
   * Tải danh sách user CHƯA được gán (storeId = null)
   * Giả sử API hỗ trợ tham số 'unassigned=true' hoặc 'storeId_isnull=true'
   */
  loadUnassignedUsers(): void {
    this.isLoading = true;
    // LƯU Ý: Đây là API giả định.
    // Bạn cần đảm bảo UserService.getUsers hỗ trợ tham số này
    // Hoặc tạo một endpoint mới 'getUnassignedUsers()'
    const params = new HttpParams().set('unassigned', 'true');

    this.userService.getUsers(params).pipe(
      map((response: any) => response.data?.content || []),
      catchError((err: Error) => {
        this.notification.showError(err.message || 'Lỗi tải danh sách user');
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(users => {
      this.unassignedUsers = users;
    });
  }

  onSave(): void {
    if (this.assignForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const userIdToAssign = this.assignForm.value.userId;

    // SỬA LỖI 2: Đổi tên hàm 'getUser' thành 'getUserById'
    // 1. Lấy thông tin đầy đủ của user
    this.userService.getUserById(userIdToAssign).pipe(
      // 2. Cập nhật user đó với storeId mới
      switchMap(fullUser => {
        // Lỗi TS2698 (Lỗi 3) sẽ tự hết khi Lỗi 2 được sửa
        const payload = { ...fullUser, storeId: this.storeId };
        return this.userService.updateUser(userIdToAssign, payload);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.notification.showSuccess('Gán user vào tiệm thành công!');
        this.dialogRef.close(true); // Trả về 'true' để list component biết cần refresh
      },
      error: (error: Error) => {
        this.notification.showError(error.message || 'Gán user thất bại');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
