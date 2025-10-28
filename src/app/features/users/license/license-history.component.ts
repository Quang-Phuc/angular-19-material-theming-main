// license-history.component.ts

import { Component, OnInit, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { Subject, Subscription, merge, of, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, map, filter, delay } from 'rxjs/operators';
import * as AOS from 'aos';

// Services and Interfaces
import { LicenseService, LicenseHistoryEntry, PagedResponse } from '../../../core/services/license.service'; // cite: 1
import { NotificationService } from '../../../core/services/notification.service';

// DIALOGS
import { ConfirmDialogComponent } from '../../../core/dialogs/confirm-dialog/confirm-dialog.component';
import { LicenseHistoryDetailDialogComponent } from '../../../core/dialogs/license-history-detail-dialog/license-history-detail-dialog.component';

// THÊM ROUTERLINK ĐỂ CHUYỂN TRANG
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-license-history',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatToolbarModule, MatTooltipModule, MatChipsModule,

    // THÊM DIALOGS VÀ ROUTERLINK VÀO IMPORTS
    ConfirmDialogComponent,
    LicenseHistoryDetailDialogComponent,
    RouterLink
  ],
  templateUrl: './license-history.component.html', // cite: 1
  styleUrl: './license-history.component.scss' // cite: 2
})
export class LicenseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  // ... (Tất cả các thuộc tính khác giữ nguyên) ...
  private licenseService = inject(LicenseService); // cite: 1
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['stt', 'packageCode', 'packageName', 'purchaseDate', 'amountPaid', 'status', 'actions']; // cite: 1
  dataSource = new MatTableDataSource<LicenseHistoryEntry>([]); // cite: 1
  @ViewChild(MatPaginator) paginator!: MatPaginator; // cite: 1
  @ViewChild(MatSort) sort!: MatSort; // cite: 1

  totalElements = 0; // cite: 1
  pageSize = 10; // cite: 1
  pageSizeOptions = [5, 10, 20, 50]; // cite: 1

  private searchSubject = new Subject<string>(); // cite: 1
  private searchSubscription!: Subscription; // cite: 1
  searchTerm = ''; // cite: 1

  isLoading = true; // cite: 1
  private dataSubscription!: Subscription; // cite: 1

  private refreshDataSubject = new Subject<void>(); // cite: 1

  ngOnInit(): void {
    AOS.init({ duration: 600, once: true });
    this.setupSearch(); // cite: 1
  }

  ngAfterViewInit(): void {
    if (this.sort) { // cite: 1
      this.sort.sortChange.subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
      });
    }
    this.loadData(); // cite: 1
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe(); // cite: 1
    this.dataSubscription?.unsubscribe(); // cite: 1
  }

  setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe( // cite: 1
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm = value;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
    });
  }

  loadData(): void {
    // Không set isLoading ở đây, để switchMap tự xử lý
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe(); // cite: 1
    }

    if (!this.paginator || !this.sort) { // cite: 1
      setTimeout(() => this.loadData(), 50);
      return;
    }

    this.dataSubscription = merge( // cite: 1
      this.sort.sortChange,
      this.paginator.page,
      this.searchSubject.pipe(debounceTime(0)),
      this.refreshDataSubject.pipe(startWith(null))
    )
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true; // cite: 1
          return this.licenseService.getLicenseHistory( // cite: 1
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchTerm
          ).pipe(
            catchError(() => { // cite: 1
              console.error('Failed to load license history');
              this.notification.showError('Không thể tải lịch sử mua.');
              return of({
                content: [], totalElements: 0, totalPages: 0, number: 0, size: this.pageSize
              } as PagedResponse<LicenseHistoryEntry>);
            })
          );
        }),
        map(data => { // cite: 1
          this.isLoading = false; // cite: 1
          this.totalElements = data.totalElements; // cite: 1
          return data.content;
        })
      )
      .subscribe(data => {
        this.dataSource.data = data; // cite: 1
      });
  }

  applyFilterFromInput(filterValue: string): void {
    this.searchSubject.next(filterValue.trim()); // cite: 1
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize; // cite: 1
  }

  announceSortChange(sortState: Sort): void {
  }

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

  viewDetails(row: LicenseHistoryEntry): void {
    this.dialog.open(LicenseHistoryDetailDialogComponent, { // cite: 1
      data: row,
      width: '500px',
      autoFocus: false
    });
  }

  /**
   * CẬP NHẬT HÀM XÓA - ĐÃ XÓA `isLoading`
   */
  deleteHistory(row: LicenseHistoryEntry): void {
    // 1. Mở dialog xác nhận
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { // cite: 1
      width: '400px',
      data: {
        title: 'Xác nhận Xóa',
        message: `Bạn có chắc chắn muốn xóa lịch sử mua gói "${row.packageName}" (Mã: ${row.packageCode})? Hành động này không thể hoàn tác.`
      }
    });

    // 2. Xử lý sau khi dialog đóng
    dialogRef.afterClosed().pipe(
      filter(result => result === true), // cite: 1
      switchMap(() => {
        // this.isLoading = true; // <-- ĐÃ XÓA

        return this.licenseService.deleteLicenseHistory(row.id).pipe( // cite: 1
          map(() => true)
        );
      }),
      catchError((err) => { // cite: 1
        console.error('Delete error:', err);
        // this.isLoading = false; // <-- ĐÃ XÓA
        this.notification.showError('Xóa thất bại. Vui lòng thử lại.');
        return of(null); // Ngăn pipe tiếp tục
      })
    ).subscribe(result => {
      // Chỉ chạy nếu API thành công (result là 'true')
      if (result) {
        // this.isLoading = false; // <-- ĐÃ XÓA
        this.notification.showSuccess('Xóa lịch sử thành công!');

        // 3. Kích hoạt tải lại dữ liệu bảng
        // Hàm loadData() sẽ tự xử lý việc bật/tắt loading
        this.refreshDataSubject.next(); // cite: 1
      }
    });
  }
}
