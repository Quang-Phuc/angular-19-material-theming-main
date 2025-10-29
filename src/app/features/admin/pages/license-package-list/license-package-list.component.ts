// src/app/features/admin/pages/license-package-list/license-package-list.component.ts (TỆP MỚI)

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Imports nội bộ
import { LicensePackage } from '../../../../core/models/license-package.model';
import { LicensePackageService } from '../../../../core/services/license-package.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';
import { LicensePackageDialogComponent } from '../../../../core/dialogs/license-package-dialog/license-package-dialog.component';

@Component({
  selector: 'app-license-package-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatToolbarModule, MatProgressBarModule, MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './license-package-list.component.html',
  styleUrl: './license-package-list.component.scss'
})
export class LicensePackageListComponent implements OnInit {

  displayedColumns: string[] = [
    'id', 'name', 'price', 'discount', 'durationDays',
    'maxStore', 'maxUserPerStore', 'description', 'actions'
  ];
  dataSource = new MatTableDataSource<LicensePackage>();
  isLoading = true;

  private packageService = inject(LicensePackageService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.isLoading = true;
    this.packageService.getLicensePackages().pipe(
      catchError((err: Error) => {
        this.notification.showError(err.message || 'Tải gói thất bại');
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(packages => {
      this.dataSource.data = packages;
    });
  }

  /**
   * Mở Dialog Thêm/Sửa
   */
  openPackageDialog(row?: LicensePackage): void {
    const dialogRef = this.dialog.open(LicensePackageDialogComponent, {
      width: '600px',
      data: row, // Truyền 'row' (sẽ là undefined nếu Thêm mới)
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadPackages(); // Tải lại bảng nếu lưu thành công
      }
    });
  }

  /**
   * Xử lý Xóa
   */
  onDeletePackage(row: LicensePackage): void {
    const dialogData: ConfirmDialogData = {
      title: 'Xác nhận Xóa Gói License',
      message: `Bạn có chắc chắn muốn XÓA gói "<b>${row.name}</b>"?<br>Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận Xóa'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.packageService.deleteLicensePackage(row.id).subscribe({
          next: () => {
            this.notification.showSuccess('Đã xóa gói thành công.');
            this.loadPackages(); // Tải lại bảng
          },
          error: (err: Error) => {
            this.notification.showError(err.message || 'Xóa thất bại.');
          }
        });
      }
    });
  }
}
