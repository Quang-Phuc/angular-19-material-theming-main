// pledge-list.component.ts (HOÀN CHỈNH - SẠCH LỖI - ĐỒNG BỘ BACKEND)

import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { merge, Subject, of, Observable, take } from 'rxjs';
import { catchError, map, startWith, switchMap, delay } from 'rxjs/operators';

import { NotificationService } from '../../../core/services/notification.service';
import {
  PledgeService,
  PagedResponse,
  PledgeContractListResponse
} from '../../../core/services/pledge.service';
import { PledgeDialogComponent } from '../../../core/dialogs/pledge-dialog/pledge-dialog.component';
import { StoreService } from '../../../core/services/store.service';

// === INTERFACE ===
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
    // Checkmark XÓA: NgFor, CurrencyPipe → không dùng trong template
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './pledge-list.component.html',
  styleUrl: './pledge-list.component.scss'
})
export class PledgeListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'stt', 'maHopDong', 'tenKhachHang', 'tsTheChap', 'soTienVay',
    'soTienDaTra', 'tienVayConLai', 'laiDenHomNay', 'trangThai', 'chucNang'
  ];

  dataSource = new MatTableDataSource<PledgeContractListResponse>();
  totalElements = 0;
  isLoading = true;

  filterForm: FormGroup;
  private refreshTrigger = new Subject<void>();

  storeList$: Observable<MappedStore[]> = of([]);
  selectedStoreId: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private pledgeService = inject(PledgeService);
  private storeService = inject(StoreService);

  constructor() {
    this.filterForm = this.fb.group({
      keyword: [''],
      loanStatus: ['dang_vay'],
      pledgeState: ['tat_ca'],
      timeRange: [null]
    });
  }

  ngOnInit(): void {
    this.loadStoreDropdown();
  }

  // Checkmark TẢI DANH SÁCH CỬA HÀNG
  private loadStoreDropdown(): void {
    this.storeList$ = this.storeService.getStoreDropdownList().pipe(
      map((response: any) => {
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map((s: ApiStore) => ({
            storeId: s.id.toString(),
            storeName: s.name
          }));
        }
        return [];
      }),
      catchError(err => {
        console.error('Lỗi tải cửa hàng:', err);
        this.notification.showError('Không tải được danh sách cửa hàng.');
        return of([]);
      })
    );

    // Chọn cửa hàng mặc định
    this.storeList$.pipe(take(1)).subscribe(stores => {
      if (stores.length > 0 && !this.selectedStoreId) {
        this.selectedStoreId = stores[0].storeId;
        this.loadPledges(); // Tải ngay khi có store
      }
    });
  }

  onStoreChange(): void {
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadPledges();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    merge(this.sort.sortChange, this.paginator.page, this.refreshTrigger)
      .pipe(
        startWith({}),
        delay(0),
        switchMap(() => {
          this.isLoading = true;

          // Checkmark CHUYỂN timeRange → fromDate/toDate
          const formValue = this.filterForm.value;
          let fromDate: string | null = null;
          let toDate: string | null = null;

          if (formValue.timeRange) {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            switch (formValue.timeRange) {
              case 'today':
                fromDate = toDate = today;
                break;
              case 'this_week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                fromDate = weekStart.toISOString().split('T')[0];
                toDate = today;
                break;
              case 'this_month':
                fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                toDate = today;
                break;
            }
          }

          const filters = {
            ...formValue,
            storeId: this.selectedStoreId,
            pledgeStatus: formValue.pledgeState, // Checkmark Map sang backend
            fromDate,
            toDate
          };

          // Xóa các field không cần
          Object.keys(filters).forEach(key => {
            if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
              delete filters[key];
            }
          });

          return this.pledgeService.getPledgeList(
            this.paginator.pageIndex,
            this.paginator.pageSize,
            filters
          ).pipe(
            catchError(err => {
              this.notification.showError('Lỗi tải dữ liệu hợp đồng');
              this.isLoading = false;
              return of(null);
            })
          );
        }),
        map(data => {
          this.isLoading = false;
          if (!data) return [];
          this.totalElements = data.totalElements;
          return data.content;
        })
      )
      .subscribe(data => this.dataSource.data = data);
  }

  loadPledges(): void {
    this.refreshTrigger.next();
  }

  applyFilters(): void {
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadPledges();
  }

  resetFilters(): void {
    this.filterForm.reset({
      keyword: '',
      loanStatus: 'dang_vay',
      pledgeState: 'tat_ca',
      timeRange: null
    });
    this.applyFilters();
  }

  // Checkmark SỬA: Truyền đúng storeId khi thêm/sửa
  openPledgeDialog(row?: PledgeContractListResponse): void {
    if (!this.selectedStoreId) {
      this.notification.showError('Vui lòng chọn cửa hàng.');
      return;
    }

    this.dialog.open(PledgeDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      disableClose: true,
      data: {
        contract: row || null,
        storeId: row?.storeId || this.selectedStoreId
      }
    }).afterClosed().subscribe(result => {
      if (result) this.loadPledges();
    });
  }

  onEdit(row: PledgeContractListResponse): void {
    this.openPledgeDialog(row);
  }

  onPrint(row: PledgeContractListResponse): void {
    this.notification.showInfo(`In hợp đồng ${row.id}`);
  }

  onShowHistory(row: PledgeContractListResponse): void {
    this.notification.showInfo(`Lịch sử hợp đồng ${row.id}`);
  }

  onDelete(row: PledgeContractListResponse): void {
    this.notification.showWarning(`Xóa hợp đồng ${row.id}? (Chưa triển khai)`);
  }

  // Checkmark THÊM: Mở danh sách thanh lý
  openLiquidationAssets(): void {
    this.notification.showInfo('Mở danh sách tài sản cần thanh lý...');
    // TODO: Mở dialog hoặc chuyển trang
  }
}
