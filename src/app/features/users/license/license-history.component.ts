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
import { MatProgressBarModule } from '@angular/material/progress-bar'; // <-- THÊM MODULE NÀY
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { Subject, Subscription, merge, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, map } from 'rxjs/operators';
import * as AOS from 'aos';

// Services and Interfaces
import { LicenseService, LicenseHistoryEntry, PagedResponse } from '../../../core/services/license.service'; // cite: 1
import { NotificationService } from '../../../core/services/notification.service';
// ...

@Component({
  selector: 'app-license-history',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule, // <-- THÊM VÀO IMPORTS
    MatToolbarModule, MatTooltipModule, MatChipsModule
  ],
  templateUrl: './license-history.component.html', // cite: 1
  styleUrl: './license-history.component.scss' // cite: 2
})
export class LicenseHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  // ... (Các thuộc tính cũ giữ nguyên)
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


  ngOnInit(): void {
    AOS.init({ duration: 600, once: true });
    this.setupSearch();
  }

  ngAfterViewInit(): void {
    // ... (Giữ nguyên logic)
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
    // ... (Giữ nguyên)
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
    // ... (Giữ nguyên logic)
    this.isLoading = true;

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    if (!this.paginator || !this.sort) {
      setTimeout(() => this.loadData(), 50);
      return;
    }

    this.dataSubscription = merge(this.sort.sortChange, this.paginator.page, this.searchSubject.pipe(debounceTime(0)))
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          return this.licenseService.getLicenseHistory( // cite: 1
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchTerm
          ).pipe(
            catchError(() => {
              console.error('Failed to load license history');
              this.notification.showError('Không thể tải lịch sử mua.');
              return of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: this.pageSize
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

  // Bỏ hàm getStatusColor(status) cũ

  /**
   * THÊM HÀM NÀY: Trả về lớp CSS cho chip trạng thái
   */
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
    console.log('Xem chi tiết:', row);
    this.notification.showInfo('Chức năng Xem chi tiết chưa được cài đặt.');
  }

  deleteHistory(row: LicenseHistoryEntry): void {
    console.log('Xóa:', row);
    this.notification.showInfo('Chức năng Xóa chưa được cài đặt.');
  }
}
