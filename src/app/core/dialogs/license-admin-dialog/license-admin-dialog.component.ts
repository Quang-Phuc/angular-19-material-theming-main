import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { LicenseHistoryEntry } from '../../services/license.service'; // Cập nhật đường dẫn nếu cần

@Component({
  selector: 'app-license-admin-dialog',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule
  ],
  templateUrl: './license-admin-dialog.component.html',
  styleUrl: './license-admin-dialog.component.scss'
})
export class LicenseAdminDialogComponent implements OnInit {

  adminForm: FormGroup;

  // Danh sách các trạng thái để chọn
  statuses = [
    { value: 'COMPLETED', viewValue: 'Hoàn thành' },
    { value: 'PENDING', viewValue: 'Chờ xử lý' },
    { value: 'FAILED', viewValue: 'Thất bại' }
  ];

  constructor(
    public dialogRef: MatDialogRef<LicenseAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LicenseHistoryEntry,
    private fb: FormBuilder
  ) {
    // Khởi tạo form với dữ liệu được truyền vào
    this.adminForm = this.fb.group({
      status: [data.status, Validators.required],
      note: [data.note || ''] // Giả định 'data' có thuộc tính 'note'
    });
  }

  ngOnInit(): void {}

  /**
   * Khi bấm nút "Lưu"
   * Dialog sẽ đóng và trả về dữ liệu đã cập nhật
   */
  onSave(): void {
    if (this.adminForm.valid) {
      this.dialogRef.close(this.adminForm.value);
    }
  }

  /**
   * Khi bấm nút "Hủy"
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
