import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge'; // Thêm MatBadgeModule
import { MatDatepickerModule } from '@angular/material/datepicker'; // Cho bộ lọc thời gian (nếu cần)
import { merge, Subject, of, Observable } from 'rxjs';
import { catchError, map, startWith, switchMap, delay } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
// (Giả sử bạn sẽ tạo PledgeDialogComponent sau)
// import { PledgeDialogComponent } from '../../../../core/dialogs/pledge-dialog/pledge-dialog.component';

// Dữ liệu giả lập dựa trên ảnh
const MOCK_DATA: any[] = [
  {
    id: 'CD252710-001',
    ngayVay: new Date('2025-10-23'),
    ngayHetHan: new Date('2025-11-26'),
    customerName: 'Nguyễn Văn C',
    collateral: 'SH 2021',
    loanAmount: 10000000,
    interestRate: '1.5%/tháng',
    paid: 0,
    remaining: 10000000,
    interestToday: 1050000,
    interestPeriod: '1 kỳ',
    status: 'Nợ'
  },
  {
    id: 'CD252310-005',
    ngayVay: new Date('2025-10-23'),
    ngayHetHan: new Date('2025-11-21'),
    customerName: 'Nguyễn Văn A',
    collateral: 'Xe SH mod...',
    loanAmount: 20000000,
    interestRate: '1 triệu/kỳ',
    paid: 400000,
    remaining: 20000000,
    interestToday: 1000000,
    interestPeriod: '1 kỳ',
    status: 'Nợ'
  },
  {
    id: 'CD252310-004',
    ngayVay: new Date('2025-10-23'),
    ngayHetHan: new Date('2025-11-21'),
    customerName: 'Nguyễn Văn A',
    collateral: 'SH mode',
    loanAmount: 20000000,
    interestRate: '250k/kỳ',
    paid: 100000,
    remaining: 20000000,
    interestToday: 250000,
    interestPeriod: '1 kỳ',
    status: 'Nợ'
  }
];

@Component({
  selector: 'app-pledge-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDialogModule, MatSelectModule, MatToolbarModule,
    MatProgressBarModule, MatMenuModule, MatTooltipModule, MatBadgeModule,
    MatDatepickerModule, CurrencyPipe, DatePipe, DecimalPipe
  ],
  templateUrl: './pledge-list.component.html',
  styleUrl: './pledge-list.component.scss'
})
export class PledgeListComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = [
    'stt', 'maHopDong', 'tenKhachHang', 'tsTheChap', 'soTienVay',
    'soTienDaTra', 'tienVayConLai', 'laiDenHomNay', 'trangThai', 'chucNang'
  ];
  dataSource = new MatTableDataSource<any>();

  totalElements = 0;
  isLoading = true;

  filterForm: FormGroup;
  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  constructor() {
    this.filterForm = this.fb.group({
      keyword: [''],
      loanStatus: ['dang_vay'], // 'Đang vay'
      pledgeState: ['tat_ca'], // 'Tất cả'
      timeRange: [null]
    });
  }

  ngOnInit(): void {
    // Logic khởi tạo nếu cần
  }

  ngAfterViewInit(): void {
    // Gán sort cho dataSource
    this.dataSource.sort = this.sort;

    // Lắng nghe các sự kiện Paginator, Sort, hoặc Refresh
    merge(this.sort.sortChange, this.paginator.page, this.refreshTrigger)
      .pipe(
        startWith({}),
        switchMap(() => this.loadPledges())
      ).subscribe(data => {
      this.dataSource.data = data;
    });
  }

  /**
   * Tải danh sách hợp đồng (Giả lập)
   */
  loadPledges(): Observable<any[]> {
    this.isLoading = true;

    // Lấy giá trị filter
    const filterValues = this.filterForm.value;
    console.log('Đang tải dữ liệu với filter:', filterValues);

    // === GIẢ LẬP API CALL ===
    // Thay thế 'of(MOCK_DATA)' bằng 'this.pledgeService.getPledges(...)'
    return of(MOCK_DATA).pipe(
      delay(500), // Giả lập độ trễ mạng
      map(data => {
        this.isLoading = false;
        this.totalElements = data.length;
        return data;
      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(error.message);
        return of([]);
      })
    );
  }

  /**
   * Áp dụng bộ lọc
   */
  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.refreshTrigger.next();
  }

  /**
   * Reset bộ lọc
   */
  resetFilters(): void {
    this.filterForm.reset({
      keyword: '',
      loanStatus: 'dang_vay',
      pledgeState: 'tat_ca',
      timeRange: null
    });
    this.applyFilters();
  }

  /**
   * Mở dialog thêm mới
   */
  openPledgeDialog(row?: any): void {
    this.notification.showInfo('Chức năng "Thêm/Sửa Hợp đồng" đang được phát triển.');
    // const dialogRef = this.dialog.open(PledgeDialogComponent, {
    //   width: '800px',
    //   data: row,
    //   disableClose: true
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result === true) {
    //     this.refreshTrigger.next();
    //   }
    // });
  }

  // === CÁC HÀNH ĐỘNG TRÊN ROW ===
  onEdit(row: any): void {
    this.openPledgeDialog(row);
  }

  onPrint(row: any): void {
    this.notification.showInfo(`Đang in hợp đồng ${row.id}...`);
  }

  onShowHistory(row: any): void {
    this.notification.showInfo(`Xem lịch sử HĐ ${row.id}...`);
  }

  onDelete(row: any): void {
    this.notification.showError(`Chức năng xóa HĐ ${row.id} chưa được kích hoạt.`);
  }

  openLiquidationAssets(): void {
   // this.notification.showWarning('Xem danh sách "Tài sản cần thanh lý"...');
  }
}
