// src/app/core/dialogs/pledge-dialog/add-warehouse-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-warehouse-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Thêm kho mới</h2>
    <mat-dialog-content>
      <form [formGroup]="warehouseForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tên kho *</mat-label>
          <input matInput formControlName="name" placeholder="VD: Kho Quận 1">
          <mat-error *ngIf="warehouseForm.get('name')?.hasError('required')">
            Tên kho là bắt buộc
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Địa chỉ</mat-label>
          <input matInput formControlName="address" placeholder="123 Đường ABC">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mô tả</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-flat-button color="primary" [disabled]="warehouseForm.invalid" (click)="onSave()">
        Thêm kho
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    mat-dialog-content { padding-bottom: 8px; }
  `]
})
export class AddWarehouseDialogComponent {
  warehouseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddWarehouseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { storeId: string }
  ) {
    this.warehouseForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      description: ['']
    });
  }

  onSave(): void {
    if (this.warehouseForm.valid) {
      this.dialogRef.close(this.warehouseForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
