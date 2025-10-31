// pledge-list.component.ts (ĐÃ CẬP NHẬT - FIX XỬ LÝ API STORE RESPONSE)
import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgFor } from '@angular/common';
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
import { FormsModule } from '@angular/forms'; // THÊM MỚI: Cho ngModel
import { merge, Subject, of, Observable, take } from 'rxjs';
import { catchError, map, startWith, switchMap, delay, tap } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';

import { PledgeService, PledgeContract, PagedResponse } from '../../../core/services/pledge.service';
import { PledgeDialogComponent } from '../../../core/dialogs/pledge-dialog/pledge-dialog.component';

// *** THÊM MỚI 1: Import StoreService ***
import { StoreService } from '../../../core/services/store.service';
// (Giả sử đường dẫn này đúng, nếu pledge-list và store-list ở thư mục khác nhau, hãy điều chỉnh)

// *** THÊM MỚI: Interface cho Store từ API ***
interface ApiStore {
  id: number;
  name: string;
  address: string;
}

interface MappedStore {
  storeId: string;
  storeName: string;
}

@Component({
  selector: 'app-pledge-list',
  standalone: true,
  imports: [
    CommonModule, NgFor, FormsModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
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
  dataSource = new MatTableDataSource<PledgeContract>();

  totalElements = 0;
  isLoading = true;

  filterForm: FormGroup;
  private refreshTrigger = new Subject<void>();

  // *** THAY ĐỔI 2: Biến chứa danh sách cửa hàng và storeId được chọn ***
  storeList$: Observable<MappedStore[]> = of([]);  // *** SỬA: Type MappedStore[] ***
  selectedStoreId: string | null = null; // THÊM MỚI: Biến riêng cho storeId

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private pledgeService = inject(PledgeService);

  // *** THÊM MỚI 3: Inject StoreService ***
  private storeService = inject(StoreService);

  constructor() {
    this.filterForm = this.fb.group({
      // *** THAY ĐỔI 4: XÓA storeId khỏi form ***
      keyword: [''],
      loanStatus: ['dang_vay'],
      pledgeState: ['tat_ca'],
      timeRange: [null]
    });
  }

  ngOnInit(): void {
    // *** THAY ĐỔI 5: Tải danh sách cửa hàng và chọn mặc định đầu tiên ***
    this.loadStoreDropdown();
  }

  /**
   * *** THAY ĐỔI 6: Hàm tải danh sách cửa hàng và chọn store đầu tiên làm mặc định ***
   * (Sửa: Map API response.data thành MappedStore[] để match HTML template)
   */
  loadStoreDropdown(): void {
    this.storeList$ = this.storeService.getStoreDropdownList().pipe(
      map((response: any) => {  // *** THÊM MỚI: Map response.data ***
        console.log('Raw store API response:', response); // THÊM: Log raw response để debug
        if (response && response.data && Array.isArray(response.data)) {
          return response.data.map((store: ApiStore) => ({
            storeId: store.id.toString(),  // *** THÊM: Convert id to string ***
            storeName: store.name
          })) as MappedStore[];
        }
        return [];
      }),
      catchError(err => {
        console.error('Lỗi tải store list:', err); // THÊM: Log error để debug
        this.notification.showError('Lỗi tải danh sách cửa hàng.');
        return of([]);
      })
    );

    // *** THÊM MỚI: Subscribe riêng để set default selectedStoreId sau khi emit
    this.storeList$.pipe(take(1)).subscribe(stores => {
      console.log('Mapped store list loaded:', stores); // THÊM: Log mapped data để debug
      if (stores && stores.length > 0 && !this.selectedStoreId) {
        this.selectedStoreId = stores[0].storeId;
        console.log('Default store selected:', this.selectedStoreId); // THÊM: Log selection
        // Trigger load pledges ngay nếu có default store
        if (this.paginator) {
          this.loadPledges();
        }
      }
    });
  }

  /**
   * *** THÊM MỚI 7: Xử lý thay đổi store ***
   */
  onStoreChange(): void {
    console.log('Store changed to:', this.selectedStoreId); // THÊM: Log để debug
    // Reset về trang đầu và refresh data khi thay đổi store
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.refreshTrigger.next();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    merge(this.sort.sortChange, this.paginator.page, this.refreshTrigger)
      .pipe(
        startWith({}),
        delay(0),
        switchMap(() => {
          this.isLoading = true;
          // *** THAY ĐỔI 8: Tạo object filter riêng, thêm storeId vào ***
          const filters = {
            ...this.filterForm.value,
            storeId: this.selectedStoreId // Luôn truyền storeId (bắt buộc)
          };
          console.log('Calling API with filters:', filters); // THÊM: Log filters để debug
          return this.pledgeService.getPledges(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            filters
          ).pipe(
            catchError((error: Error) => {
              console.error('API error:', error); // THÊM: Log error
              this.isLoading = false;
              this.notification.showError(error.message || 'Lỗi khi tải hợp đồng');
              return of(null);
            })
          );
        }),
        map(data => {
          this.isLoading = false;
          if (data === null) {
            return [];
          }
          this.totalElements = data.totalElements;
          return data.content;
        })
      ).subscribe(data => {
      console.log('Pledges loaded:', data); // THÊM: Log data để debug
      this.dataSource.data = data;
    });
  }

  loadPledges(): void {
    this.refreshTrigger.next();
  }

  applyFilters(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.refreshTrigger.next();
  }

  /**
   * *** THAY ĐỔI 9: Cập nhật hàm reset (không reset storeId) ***
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
   * *** THAY ĐỔI 10: Cập nhật hàm mở dialog (sử dụng selectedStoreId) ***
   */
  openPledgeDialog(row?: PledgeContract): void {
    // *** THAY ĐỔI: Luôn có selectedStoreId vì store là bắt buộc ***
    if (!this.selectedStoreId) {
      this.notification.showError('Vui lòng chọn một cửa hàng trước khi thêm mới.');
      return;
    }

    const dialogRef = this.dialog.open(PledgeDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      // Truyền một object chứa contract và storeId
      data: {
        contract: row, // Dữ liệu hợp đồng (null nếu thêm mới)
        // Nếu là sửa (row có data), dùng storeId của row (nếu khác).
        // Nếu là thêm mới (row là null), dùng selectedStoreId.
        storeId: row ? row.storeId : this.selectedStoreId
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.refreshTrigger.next();
      }
    });
  }

  // === CÁC HÀNH ĐỘNG TRÊN ROW ===
  onEdit(row: PledgeContract): void {
    this.openPledgeDialog(row);
  }

  onPrint(row: PledgeContract): void {
    this.notification.showInfo(`Đang in hợp đồng ${row.id}...`);
  }

  onShowHistory(row: PledgeContract): void {
    this.notification.showInfo(`Xem lịch sử HĐ ${row.id}...`);
  }

  onDelete(row: PledgeContract): void {
    this.notification.showWarning(`Bạn có chắc muốn xóa HĐ ${row.id}? (Chưa thực thi)`);
  }

  openLiquidationAssets(): void {
    // this.notification.showWarning('Xem danh sách "Tài sản cần thanh lý"...');
  }
}
