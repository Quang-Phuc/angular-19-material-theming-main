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
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { merge, Subject, of, Observable } from 'rxjs';
// *** THÊM 'delay' VÀO IMPORT ***
import { catchError, map, startWith, switchMap, delay } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';

// *** THAY ĐỔI 1: Import Service và Dialog mới ***
import { PledgeService, PledgeContract, PagedResponse } from '../../../core/services/pledge.service';
import { PledgeDialogComponent } from '../../../core/dialogs/pledge-dialog/pledge-dialog.component';

// (Xóa MOCK_DATA ở đây vì nó đã được chuyển vào service để giả lập)

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
  // *** THAY ĐỔI 2: Sử dụng interface PledgeContract ***
  dataSource = new MatTableDataSource<PledgeContract>();

  totalElements = 0;
  isLoading = true;

  filterForm: FormGroup;
  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  // *** THAY ĐỔI 3: Inject PledgeService ***
  private pledgeService = inject(PledgeService);

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
        // *** SỬA LỖI: Thêm delay(0) để tránh lỗi NG0100 ***
        delay(0),
        // *** THAY ĐỔI 4: Gọi service thay vì mock data ***
        switchMap(() => {
          this.isLoading = true;
          return this.pledgeService.getPledges(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.filterForm.value
          ).pipe(
            catchError((error: Error) => {
              this.isLoading = false;
              this.notification.showError(error.message || 'Lỗi khi tải hợp đồng');
              return of(null); // Trả về null nếu lỗi
            })
          );
        }),
        map(data => {
          this.isLoading = false;
          if (data === null) {
            return []; // Mảng rỗng nếu có lỗi
          }
          this.totalElements = data.totalElements;
          return data.content;
        })
      ).subscribe(data => {
      this.dataSource.data = data;
    });
  }

  /**
   * (Đã được thay thế bằng logic trong ngAfterViewInit)
   */
  loadPledges(): void {
    // Hàm này giờ không cần thiết vì logic đã ở trong switchMap
    // nhưng nếu muốn gọi thủ công, có thể dùng refreshTrigger
    this.refreshTrigger.next();
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
   * Mở dialog thêm mới/chỉnh sửa
   */
  openPledgeDialog(row?: PledgeContract): void {
    // *** THAY ĐỔI 5: Mở PledgeDialogComponent ***
    const dialogRef = this.dialog.open(PledgeDialogComponent, {
      width: '90%', // Tăng độ rộng cho dialog
      maxWidth: '1200px',
      data: row, // Truyền 'row' vào dialog (sẽ là null nếu Thêm mới)
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      // Nếu dialog trả về 'true' (lưu thành công)
      if (result === true) {
        this.refreshTrigger.next(); // Tải lại danh sách
      }
    });
  }

  // === CÁC HÀNH ĐỘNG TRÊN ROW ===
  onEdit(row: PledgeContract): void {
    // Truyền dữ liệu 'row' vào dialog để Sửa
    this.openPledgeDialog(row);
  }

  onPrint(row: PledgeContract): void {
    this.notification.showInfo(`Đang in hợp đồng ${row.id}...`);
  }

  onShowHistory(row: PledgeContract): void {
    this.notification.showInfo(`Xem lịch sử HĐ ${row.id}...`);
  }

  onDelete(row: PledgeContract): void {
    // TODO: Thêm dialog xác nhận trước khi xóa
    this.notification.showWarning(`Bạn có chắc muốn xóa HĐ ${row.id}? (Chưa thực thi)`);
    // this.pledgeService.deletePledge(row.id!).subscribe(...)
  }

  openLiquidationAssets(): void {
    // this.notification.showWarning('Xem danh sách "Tài sản cần thanh lý"...');
  }
}
