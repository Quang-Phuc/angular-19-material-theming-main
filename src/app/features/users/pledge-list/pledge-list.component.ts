// src/app/features/users/pledge-list/pledge-list.component.ts
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
import { ApiService } from '../../../core/services/api.service';
import { PledgeSearchFilters } from '../../../core/models/pledge-search-filters.interface';

interface ApiStore { id: number; name: string; address: string; }
interface MappedStore { storeId: string; storeName: string; }
interface UserStore { id: number; fullName: string; phone: string; }
interface ApiResponse<T> { data?: T; }

@Component({
  selector: 'app-pledge-list',
  standalone: true,
  imports: [
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
    MatDatepickerModule,
    MatNativeDateModule,
    DecimalPipe
  ],
  providers: [
    DatePipe  // THÊM VÀO ĐÂY – BẮT BUỘC!
  ],
  templateUrl: './pledge-list.component.html',
  styleUrl: './pledge-list.component.scss'
})
export class PledgeListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['stt', 'maHopDong', 'tenKhachHang', 'tsTheChap', 'soTienVay', 'soTienDaTra', 'tienVayConLai', 'laiDenHomNay', 'trangThai', 'chucNang'];
  dataSource = new MatTableDataSource<PledgeContractListResponse>();
  totalElements = 0;
  isLoading = true;
  filterForm: FormGroup;
  private refreshTrigger = new Subject<void>();
  storeList$: Observable<MappedStore[]> = of([]);
  followerList$: Observable<UserStore[]> = of([]);
  selectedStoreId: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private pledgeService = inject(PledgeService);
  private storeService = inject(StoreService);
  private apiService = inject(ApiService);
  private datePipe = inject(DatePipe); // HOẠT ĐỘNG

  constructor() {
    this.filterForm = this.fb.group({
      keyword: [''], loanStatus: ['dang_vay'], pledgeState: ['tat_ca'],
      fromDate: [null], toDate: [null], follower: ['']
    });
  }

  ngOnInit(): void { this.loadStoreDropdown(); }

  private loadStoreDropdown(): void {
    this.storeList$ = this.storeService.getStoreDropdownList().pipe(
      map((res: any) => res?.data?.map((s: ApiStore) => ({ storeId: s.id.toString(), storeName: s.name })) || []),
      catchError(err => { console.error(err); this.notification.showError('Lỗi tải cửa hàng'); return of([]); })
    );

    this.storeList$.pipe(take(1)).subscribe(stores => {
      if (stores.length > 0 && !this.selectedStoreId) {
        this.selectedStoreId = stores[0].storeId;
        this.loadFollowers(); this.loadPledges();
      }
    });
  }

  private loadFollowers(): void {
    if (!this.selectedStoreId) return;
    this.followerList$ = this.apiService.get<ApiResponse<UserStore[]>>(`/v1/stores/${this.selectedStoreId}/staffs`).pipe(
      map(res => res.data ?? []),
      catchError(err => { console.error(err); this.notification.showError('Lỗi tải người theo dõi'); return of([]); })
    );
  }

  onStoreChange(): void { this.loadFollowers(); this.paginator.pageIndex = 0; this.loadPledges(); }
  onFollowerChange(value: string): void { this.applyFilters(); }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    merge(this.sort.sortChange, this.paginator.page, this.refreshTrigger).pipe(
      startWith({}), delay(0),
      switchMap(() => {
        this.isLoading = true;
        const fv = this.filterForm.value;
        const fromDate = fv.fromDate ? this.datePipe.transform(fv.fromDate, 'yyyy-MM-dd') || undefined : undefined;
        const toDate = fv.toDate ? this.datePipe.transform(fv.toDate, 'yyyy-MM-dd') || undefined : undefined;

        const filters: PledgeSearchFilters = {
          keyword: fv.keyword || undefined,
          loanStatus: fv.loanStatus || undefined,
          pledgeStatus: fv.pledgeState || undefined,
          storeId: this.selectedStoreId || undefined,
          fromDate, toDate,
          follower: fv.follower || undefined
        };

        (Object.keys(filters) as (keyof PledgeSearchFilters)[]).forEach(k => {
          if (filters[k] === '' || filters[k] == null) delete filters[k];
        });

        return this.pledgeService.getPledgeList(this.paginator.pageIndex, this.paginator.pageSize, filters).pipe(
          catchError(err => { this.notification.showError('Lỗi tải dữ liệu'); this.isLoading = false; return of(null); })
        );
      }),
      map(data => { this.isLoading = false; if (!data) return []; this.totalElements = data.totalElements; return data.content; })
    ).subscribe(data => this.dataSource.data = data);
  }

  loadPledges(): void { this.refreshTrigger.next(); }
  applyFilters(): void { this.paginator.pageIndex = 0; this.loadPledges(); }
  resetFilters(): void { this.filterForm.reset({ keyword: '', loanStatus: 'dang_vay', pledgeState: 'tat_ca', fromDate: null, toDate: null, follower: '' }); this.applyFilters(); }

  openPledgeDialog(row?: PledgeContractListResponse): void {
    if (!this.selectedStoreId) { this.notification.showError('Chọn cửa hàng'); return; }
    this.dialog.open(PledgeDialogComponent, { width: '90%', maxWidth: '1200px', disableClose: true, data: { contract: row || null, storeId: row?.storeId || this.selectedStoreId } })
      .afterClosed().subscribe(r => { if (r) this.loadPledges(); });
  }

  onEdit(row: PledgeContractListResponse): void { this.openPledgeDialog(row); }
  onPrint(row: PledgeContractListResponse): void { this.notification.showInfo(`In hợp đồng ${row.id}`); }
  onShowHistory(row: PledgeContractListResponse): void { this.notification.showInfo(`Lịch sử ${row.id}`); }
  onDelete(row: PledgeContractListResponse): void { this.notification.showWarning(`Xóa ${row.id}?`); }
  openLiquidationAssets(): void { this.notification.showInfo('Tài sản cần thanh lý...'); }
}
