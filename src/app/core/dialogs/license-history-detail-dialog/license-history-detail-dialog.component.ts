import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LicenseHistoryEntry } from '../../services/license.service'; // Giả định đường dẫn này đúng

@Component({
  selector: 'app-license-history-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatDialogModule, MatButtonModule, MatChipsModule, MatIconModule
  ],
  templateUrl: './license-history-detail-dialog.component.html',
  styleUrl: './license-history-detail-dialog.component.scss'
})
export class LicenseHistoryDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LicenseHistoryDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LicenseHistoryEntry
  ) {}

  // Sao chép các hàm helper từ component cha
  getStatusClass(status: string): string {
    const baseClass = 'status-chip';
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return `${baseClass} status-completed`;
      case 'PENDING': return `${baseClass} status-pending`;
      case 'FAILED': return `${baseClass} status-failed`;
      default: return `${baseClass} status-default`;
    }
  }

  getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'PENDING': return 'Chờ xử lý';
      case 'FAILED': return 'Thất bại';
      default: return status || 'Không rõ';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
