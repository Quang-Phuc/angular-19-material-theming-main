// pawn-contract.component.ts

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
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router'; // Giữ lại RouterLink nếu cần

// <-- THAY ĐỔI: Imports mới
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { Subject, Subscription, merge, of, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError, map, filter, delay } from 'rxjs/operators';
import * as AOS from 'aos';

// <-- THAY ĐỔI: Services và Interfaces (Giả lập)
// (Bạn sẽ thay thế bằng Service và Interface thật của mình)
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../core/dialogs/confirm-dialog/confirm-dialog.component';
// import { PawnContractDetailDialogComponent } from '...'; // Dialog chi tiết
// import { PawnContractFormDialogComponent } from '...'; // Dialog thêm/sửa

// --- GIẢ LẬP SERVICE VÀ INTERFACE ---
// (Bạn nên chuyển ra file riêng)
export interface PawnContractEntry {
  id: string;
  contractId: string;
  contractDate: string;
  expiryDate: string;
  customerName: string;
  customerPhone: string;
  collateral: string; // TS thế chấp
  loanAmount: number; // Số tiền vay
  amountPaid: number; // Đã trả
  remainingLoan: number; // Còn lại
  interestToday: number; // Lãi đến nay
  status: string; // 'BORROWING', 'PAID', 'OVERDUE', 'LIQUIDATED'
  note?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PawnContractFilters {
  search: string;
  status: string;
  condition: string;
  timeRange: string;
}

// Giả lập Service
// @Injectable({ providedIn: 'root' })
class MockPawnContractService {
  getPawnContracts(page: number, size: number, filters: PawnContractFilters) {
    console.log('Fetching data with filters:', filters);
    // Dữ liệu giả lập
    const mockData: PawnContractEntry[] = [
      { id: '1', contractId: 'CD250810-001', contractDate: '2025-08-10T10:00:00Z', expiryDate: '2025-09-10T10:00:00Z', customerName: 'Nguyễn Văn A', customerPhone: '0909123456', collateral: 'Xe máy Honda Wave', loanAmount: 10000000, amountPaid: 2000000, remainingLoan: 8000000, interestToday: 50000, status: 'BORROWING' },
      { id: '2', contractId: 'CD250809-002', contractDate: '2025-08-09T14:30:00Z', expiryDate: '2025-09-09T14:30:00Z', customerName: 'Trần Thị B', customerPhone: '0909654321', collateral: 'Laptop Dell XPS 15', loanAmount: 15000000, amountPaid: 15000000, remainingLoan: 0, interestToday: 0, status: 'PAID' },
      { id: '3', contractId: 'CD250701-001', contractDate: '2025-07-01T09:00:00Z', expiryDate: '2025-08-01T09:00:00Z', customerName: 'Lê Văn C', customerPhone: '0988111222', collateral: 'Điện thoại iPhone 15 Pro', loanAmount: 20000000, amountPaid: 10000000, remainingLoan: 10000000, interestToday: 1200000, status: 'OVERDUE' },
    ];

    const response: PagedResponse<PawnContractEntry> = {
      content: mockData,
      totalElements: 3,
      totalPages: 1,
      number: 0,
      size: 10
    };
    // Giả lập độ trễ API
    return of(response).pipe(delay(500));
  }

  deletePawnContract(id: string) {
    console.log('Deleting contract:', id);
    return of({ success: true }).pipe(delay(300));
  }
}
// --- HẾT PHẦN GIẢ LẬP ---


@Component({
  selector: 'app-pawn-contract', // <-- THAY ĐỔI
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatToolbarModule, MatTooltipModule, MatChipsModule,
    MatMenuModule,
    RouterLink,
    ConfirmDialogComponent,

    // <-- THAY ĐỔI: Imports mới
    ReactiveFormsModule,
    MatSelectModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './pawn-contract.component.html', // <-- THAY ĐỔI
  styleUrl: './pawn-contract.component.scss', // <-- THAY ĐỔI
  // <-- THAY ĐỔI: Cung cấp service giả lập (Xóa dòng này khi dùng service thật)
  providers: [
    { provide: 'PawnContractService', useClass: MockPawnContractService }
  ]
})
export class PawnContractComponent implements OnInit, AfterViewInit, OnDestroy {
  // <-- THAY ĐỔI: Inject service mới và FormBuilder
  private pawnContractService = inject<MockPawnContractService>('PawnContractService');
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  // <-- THAY ĐỔI: Danh sách cột mới
  displayedColumns: string[] = [
    'stt', 'contractId', 'customerName', 'collateral',
    'loanAmount', 'amountPaid', 'remainingLoan', 'interestToday',
    'status', 'actions'
  ];
  dataSource = new MatTableDataSource<PawnContractEntry>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  totalElements = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // <-- THAY ĐỔI: Quản lý filter bằng FormGroup
  filterForm!: FormGroup;

  isLoading = true;
  private dataSubscription!: Subscription;
  private refreshDataSubject = new Subject<void>();

  // <-- THAY ĐỔI: Biến cho badge
  itemsToLiquidate = 3; // (Bạn sẽ lấy số này từ API)

  ngOnInit(): void {
    AOS.init({ duration: 600, once: true });
    this.setupFilters();
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
    this.dataSubscription?.unsubscribe();
  }

  // <-- THAY ĐỔI: Khởi tạo form cho bộ lọc
  setupFilters(): void {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['all'],
      condition: ['all'],
      timeRange: ['all']
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

    // Giữ nguyên logic merge, refreshDataSubject sẽ được trigger bởi applyFilters()
    this.dataSubscription = merge(
      this.sort.sortChange,
      this.paginator.page,
      this.refreshDataSubject.pipe(startWith(null)) // Bỏ searchSubject
    )
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          // <-- THAY ĐỔI: Lấy filter values và gọi service mới
          const filters: PawnContractFilters = this.filterForm.value;
          return this.pawnContractService.getPawnContracts(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            filters
          ).pipe(
            catchError(() => {
              this.notification.showError('Không thể tải danh sách hợp đồng.');
              return of({
                content: [], totalElements: 0, totalPages: 0, number: 0, size: this.pageSize
              } as PagedResponse<PawnContractEntry>);
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

  // <-- THAY ĐỔI: Hàm được gọi bởi nút "Tìm"
  applyFilters(): void {
    this.paginator.pageIndex = 0; // Quay về trang đầu
    this.refreshDataSubject.next(); // Kích hoạt loadData
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
  }

  announceSortChange(sortState: Sort): void {
    // (Giữ nguyên logic)
  }

  // <-- THAY ĐỔI: Cập nhật class cho status mới
  getStatusClass(status: string): string {
    const baseClass = 'status-chip';
    switch (status?.toUpperCase()) {
      case 'BORROWING': return `${baseClass} status-borrowing`;
      case 'PAID': return `${baseClass} status-paid`;
      case 'OVERDUE': return `${baseClass} status-overdue`;
      case 'LIQUIDATED': return `${baseClass} status-liquidated`;
      default: return `${baseClass} status-default`;
    }
  }

  // <-- THAY ĐỔI: Cập nhật text cho status mới
  getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'BORROWING': return 'Đang vay';
      case 'PAID': return 'Đã trả';
      case 'OVERDUE': return 'Quá hạn';
      case 'LIQUIDATED': return 'Thanh lý';
      default: return status || 'Không rõ';
    }
  }

  // <-- THAY ĐỔI: Các hàm hành động (Action) mới

  addNewContract(): void {
    console.log('Mở dialog thêm mới hợp đồng');
    /*
    const dialogRef = this.dialog.open(PawnContractFormDialogComponent, {
      width: '700px',
      data: null, // (data = null nghĩa là Thêm mới)
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe(() => {
      this.notification.showSuccess('Thêm hợp đồng thành công!');
      this.refreshDataSubject.next();
    });
    */
  }

  viewContract(row: PawnContractEntry): void {
    console.log('View details for:', row);
    /*
    this.dialog.open(PawnContractDetailDialogComponent, {
      data: row,
      width: '600px',
      autoFocus: false
    });
    */
  }

  editContract(row: PawnContractEntry): void {
    console.log('Mở dialog sửa hợp đồng:', row);
    /*
    const dialogRef = this.dialog.open(PawnContractFormDialogComponent, {
      width: '700px',
      data: row, // (Truyền data vào là Sửa)
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe(() => {
      this.notification.showSuccess('Cập nhật hợp đồng thành công!');
      this.refreshDataSubject.next();
    });
    */
  }

  printContract(row: PawnContractEntry): void {
    this.notification.showInfo(`Đang chuẩn bị in hợp đồng: ${row.contractId}...`);
    // (Logic in ấn ở đây)
  }

  logPayment(row: PawnContractEntry): void {
    console.log('Mở dialog ghi nhận thanh toán cho:', row);
    /*
    this.dialog.open(LogPaymentDialogComponent, {
      data: row,
      width: '500px',
      autoFocus: false
    });
    */
  }

  deleteContract(row: PawnContractEntry): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận Xóa',
        message: `Bạn có chắc chắn muốn xóa hợp đồng "${row.contractId}" của khách hàng "${row.customerName}"?`
      }
    });

    dialogRef.afterClosed().pipe(
      filter(result => result === true),
      switchMap(() => {
        // <-- THAY ĐỔI: Gọi service xóa mới
        return this.pawnContractService.deletePawnContract(row.id).pipe(
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
        this.notification.showSuccess('Xóa hợp đồng thành công!');
        this.refreshDataSubject.next();
      }
    });
  }
}
