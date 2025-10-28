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

// THÊM CÁC IMPORT CẦN THIẾT
import { Subject, Subscription, merge, of, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, map, filter, delay } from 'rxjs/operators';
import * as AOS from 'aos';

// Services and Interfaces
import { LicenseService, LicenseHistoryEntry, PagedResponse } from '../../../core/services/license.service';
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
  templateUrl: './license-history.component.html',
  styleUrl: './license-history.component.scss'
})
export class LicenseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['stt', 'packageCode', 'packageName', 'purchaseDate', 'amountPaid', 'status', 'actions'];
  dataSource = new MatTableDataSource<LicenseHistoryEntry>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  totalElements = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  searchTerm = '';

  isLoading = true;
  private dataSubscription!: Subscription;

  // SUBJECT ĐỂ KÍCH HOẠT TẢI LẠI DỮ LIỆU
  private refreshDataSubject = new Subject<void>();

  ngOnInit(): void {
    AOS.init({ duration: 600, once: true });
    this.setupSearch();
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
      });
    }
    this.loadData();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.dataSubscription?.unsubscribe();
  }

  setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
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
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    if (!this.paginator || !this.sort) {
      setTimeout(() => this.loadData(), 50);
      return;
    }

    // CẬP NHẬT MERGE ĐỂ LẮNG NGHE refreshDataSubject
    this.dataSubscription = merge(
      this.sort.sortChange,
      this.paginator.page,
      this.searchSubject.pipe(debounceTime(0)),
      this.refreshDataSubject.pipe(startWith(null)) // Thêm refresh trigger
    )
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          return this.licenseService.getLicenseHistory(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchTerm
          ).pipe(
            catchError(() => {
              console.error('Failed to load license history');
              this.notification.showError('Không thể tải lịch sử mua.');
              return of({
                content: [], totalElements: 0, totalPages: 0, number: 0, size: this.pageSize
              } as PagedResponse<LicenseHistoryEntry>);
            })
          );
        }),
        map(data => {
          this.isLoading = false;
          this.totalElements = data.totalElements;
          return data.content;
        })
      )
      .subscribe(data => {
        this.dataSource.data = data;
      });
  }

  applyFilterFromInput(filterValue: string): void {
    this.searchSubject.next(filterValue.trim());
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
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

  /**
   * HÀM XEM CHI TIẾT
   */
  viewDetails(row: LicenseHistoryEntry): void {
    this.dialog.open(LicenseHistoryDetailDialogComponent, {
      data: row,
      width: '500px', // Đặt chiều rộng dialog
      autoFocus: false
    });
  }

  /**
   * HÀM XÓA (ĐÃ SỬA LẠI LOGIC LOADING)
   */
  deleteHistory(row: LicenseHistoryEntry): void {
    // 1. Mở dialog xác nhận
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận Xóa',
        message: `Bạn có chắc chắn muốn xóa lịch sử mua gói "${row.packageName}" (Mã: ${row.packageCode})? Hành động này không thể hoàn tác.`
      }
    });

    // 2. Xử lý sau khi dialog đóng
    dialogRef.afterClosed().pipe(
      filter(result => result === true), // Chỉ tiếp tục nếu người dùng bấm "Xác nhận"
      switchMap(() => {
        // Không set isLoading = true ở đây
        return this.licenseService.deleteLicenseHistory(row.id).pipe(
          map(() => true) // Chuyển đổi kết quả (nếu API trả về void hoặc object) thành 'true'
        );
      }),
      catchError((err) => {
        // Xử lý nếu API trả về lỗi
        console.error('Delete error:', err);
        // Không set isLoading = false ở đây
        this.notification.showError('Xóa thất bại. Vui lòng thử lại.');
        return of(null); // Ngăn pipe tiếp tục
      })
    ).subscribe(result => {
      // Chỉ chạy nếu API thành công (result là 'true')
      if (result) {
        // Không set isLoading = false ở đây
        this.notification.showSuccess('Xóa lịch sử thành công!');

        // 3. Kích hoạt tải lại dữ liệu bảng
        // Hàm loadData() sẽ tự xử lý việc bật/tắt loading
        this.refreshDataSubject.next();
      }
    });
  }
}
