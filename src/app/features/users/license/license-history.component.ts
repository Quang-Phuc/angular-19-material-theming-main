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
import { MatMenuModule } from '@angular/material/menu'; // <-- *** THÊM IMPORT NÀY ***

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
import { LicenseAdminDialogComponent } from '../../../core/dialogs/license-admin-dialog/license-admin-dialog.component';

// CẬP NHẬT IMPORT ROUTER
import { RouterLink, ActivatedRoute } from '@angular/router'; // Thêm ActivatedRoute

@Component({
  selector: 'app-license-history',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatToolbarModule, MatTooltipModule, MatChipsModule,
    MatMenuModule, // <-- *** THÊM VÀO IMPORTS ***

    // THÊM DIALOGS VÀ ROUTERLINK VÀO IMPORTS
    ConfirmDialogComponent,
    LicenseHistoryDetailDialogComponent,
    LicenseAdminDialogComponent,
    RouterLink
  ],
  templateUrl: './license-history.component.html',
  styleUrl: './license-history.component.scss'
})
export class LicenseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute); // <-- INJECT ROUTE

  // BIẾN MỚI ĐỂ PHÂN QUYỀN
  public isAdmin: boolean = false;

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

    // THÊM LOGIC KIỂM TRA ADMIN
    const parentPath = this.route.parent?.snapshot.url[0]?.path;
    this.isAdmin = (parentPath === 'admin');

    this.loadData();
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
      });
    }
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

    this.dataSubscription = merge(
      this.sort.sortChange,
      this.paginator.page,
      this.searchSubject.pipe(debounceTime(0)),
      this.refreshDataSubject.pipe(startWith(null))
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

  viewDetails(row: LicenseHistoryEntry): void {
    this.dialog.open(LicenseHistoryDetailDialogComponent, {
      data: row,
      width: '500px',
      autoFocus: false
    });
  }

  deleteHistory(row: LicenseHistoryEntry): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận Xóa',
        message: `Bạn có chắc chắn muốn xóa lịch sử mua gói "${row.packageName}" (Mã: ${row.packageCode})? Hành động này không thể hoàn tác.`
      }
    });

    dialogRef.afterClosed().pipe(
      filter(result => result === true),
      switchMap(() => {
        return this.licenseService.deleteLicenseHistory(row.id).pipe(
          map(() => true)
        );
      }),
      catchError((err) => {
        console.error('Delete error:', err);
        this.notification.showError('Xóa thất bại. Vui lòng thử lại.');
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.notification.showSuccess('Xóa lịch sử thành công!');
        this.refreshDataSubject.next();
      }
    });
  }

  editHistory(row: LicenseHistoryEntry): void {
    const dialogRef = this.dialog.open(LicenseAdminDialogComponent, {
      width: '550px',
      data: row,
      autoFocus: false
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((updatedData: { status: string, note: string }) => {
        return this.licenseService.updateLicenseHistory(row.id, updatedData).pipe(
          map(() => true)
        );
      }),
      catchError((err) => {
        console.error('Update error:', err);
        this.notification.showError('Cập nhật thất bại. Vui lòng thử lại.');
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.notification.showSuccess('Cập nhật lịch sử thành công!');
        this.refreshDataSubject.next();
      }
    });
  }
}
