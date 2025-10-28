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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { Subject, Subscription, merge, of } from 'rxjs'; // Import 'of'
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, map } from 'rxjs/operators';
import * as AOS from 'aos';

// Services and Interfaces
import { LicenseService, LicenseHistoryEntry, PagedResponse } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';
// TODO: Create these dialog components
// import { LicenseHistoryDetailDialogComponent } from '../../../core/dialogs/license-history-detail-dialog/license-history-detail-dialog.component';
// import { ConfirmDialogComponent } from '../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-license-history',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule, MatToolbarModule, MatTooltipModule, MatChipsModule
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
    this.loadData(); // Initial data load
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
      // Note: loadData is triggered by merge() in ngAfterViewInit,
      // no need to call it explicitly here unless merge strategy changes.
      // this.loadData();
    });
  }

  loadData(): void {
    this.isLoading = true; // Set loading true at the start

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    // Ensure paginator and sort are ready before subscribing
    if (!this.paginator || !this.sort) {
      // If not ready, retry after a short delay
      setTimeout(() => this.loadData(), 50);
      return;
    }

    this.dataSubscription = merge(this.sort.sortChange, this.paginator.page, this.searchSubject.pipe(debounceTime(0)))
      .pipe(
        startWith({}), // Trigger initial load
        switchMap(() => {
          this.isLoading = true; // Set loading true before API call
          return this.licenseService.getLicenseHistory(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.searchTerm
          ).pipe(
            catchError(() => {
              console.error('Failed to load license history');
              this.notification.showError('Không thể tải lịch sử mua.'); // Show error to user
              return of({ // Return default structure on error
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: this.pageSize
              } as PagedResponse<LicenseHistoryEntry>);
            })
          );
        }),
        // Moved map inside the main pipe, after switchMap and catchError
        map(data => {
          this.isLoading = false; // Set loading false after data processing
          this.totalElements = data.totalElements;
          return data.content; // Pass content to the subscription
        })
      )
      .subscribe(data => {
        this.dataSource.data = data; // Update table data
      });
  }


  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
    // Data reload is handled by the merge() observable in loadData()
  }

  announceSortChange(sortState: Sort): void {
    // Optional: Implement accessibility message
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'primary';
      case 'PENDING': return 'accent';
      case 'FAILED': return 'warn';
      default: return undefined;
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
    // TODO: Open LicenseHistoryDetailDialogComponent
    this.notification.showInfo('Chức năng Xem chi tiết chưa được cài đặt.');
  }

  deleteHistory(row: LicenseHistoryEntry): void {
    console.log('Xóa:', row);
    // TODO: Open ConfirmDialogComponent and handle deletion
    this.notification.showInfo('Chức năng Xóa chưa được cài đặt.');
  }
}
