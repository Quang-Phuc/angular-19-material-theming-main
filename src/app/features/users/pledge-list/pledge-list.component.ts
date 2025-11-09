import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, take } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PledgeDialogComponent } from '../../../core/dialogs/pledge-dialog/pledge-dialog.component';
import { PledgeService, PledgeListItem, PagedResult } from '../../../core/services/pledge.service';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.model';
import { ApiStore } from '../../../core/models/store.model';
import { UserStore } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

interface StoreItem { storeId: string; storeName: string; }

@Component({
  selector: 'app-pledge-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule,
    MatToolbarModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatTooltipModule, MatMenuModule, MatBadgeModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule, MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './pledge-list.component.html',
  styleUrls: ['./pledge-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PledgeListComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private pledgeService = inject(PledgeService);
  private cdr = inject(ChangeDetectorRef);
  private snack = inject(MatSnackBar);
  private apiService = inject(ApiService);
  private notification = inject(NotificationService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup = this.fb.group({
    keyword: [''],
    loanStatus: [''],
    pledgeState: [''],
    fromDate: [null],
    toDate: [null],
    follower: ['']
  });

  selectedStoreId: string | null = null;

  storeList$!: Observable<StoreItem[]>;
  followerList$!: Observable<UserStore[]>;

  displayedColumns = [
    'stt',
    'maHopDong',
    'tenKhachHang',
    'tsTheChap',
    'soTienVay',
    'soTienDaTra',
    'tienVayConLai',
    'laiDenHomNay',
    'trangThai',
    'chucNang'
  ];
  dataSource = new MatTableDataSource<PledgeListItem>([]);
  isLoading = false;
  totalElements = 0;

  ngOnInit(): void {
    this.loadStoreDropdown();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadStoreDropdown(): void {
    this.storeList$ = this.apiService.get<ApiResponse<ApiStore[]>>('/v1/stores').pipe(
      map(res => (res?.data ?? []).map((s: ApiStore) => ({
        storeId: String(s.id),
        storeName: s.name
      }))),
      catchError(err => {
        console.error(err);
        this.notification.showError('Lỗi tải cửa hàng');
        return of<StoreItem[]>([]);
      })
    );

    this.storeList$.pipe(take(1)).subscribe(stores => {
      if (stores.length > 0 && !this.selectedStoreId) {
        this.selectedStoreId = stores[0].storeId;
        this.loadFollowers();
        this.loadPledges();
      }
    });
  }

  private loadFollowers(): void {
    if (!this.selectedStoreId) return;
    this.followerList$ = this.apiService
      .get<ApiResponse<UserStore[]>>(`/v1/stores/${this.selectedStoreId}/staffs`)
      .pipe(
        map(res => res.data ?? []),
        catchError(err => {
          console.error(err);
          this.notification.showError('Lỗi tải người theo dõi');
          return of<UserStore[]>([]);
        })
      );
  }

  onStoreChange(): void {
    this.loadFollowers();
    this.loadPledges();
  }

  onFollowerChange(_: string): void {}

  loadPledges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.isLoading = true;
    const f = this.filterForm.value;

    this.pledgeService.searchPledges({
      keyword: f.keyword,
      loanStatus: f.loanStatus,
      pledgeState: f.pledgeState,
      fromDate: f.fromDate,
      toDate: f.toDate,
      follower: f.follower,
      storeId: this.selectedStoreId
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res: PagedResult<PledgeListItem>) => {
          this.dataSource.data = res.items;
          this.totalElements = res.total;
          this.cdr.markForCheck();
        },
        error: () => this.snack.open('Không tải được danh sách', 'Đóng', { duration: 3000 })
      });
  }

  resetFilters(): void {
    this.filterForm.reset({
      keyword: '',
      loanStatus: '',
      pledgeState: '',
      fromDate: null,
      toDate: null,
      follower: ''
    });
    this.applyFilters();
  }

  openPledgeDialog(row?: PledgeListItem, viewMode = false): void {
    const ref = this.dialog.open(PledgeDialogComponent, {
      width: '1080px',
      maxWidth: '98vw',
      data: {
        contractId: row?.id ?? null,
        storeId: row?.storeId ?? this.selectedStoreId ?? null,
        viewMode
      }
    });
    ref.afterClosed().subscribe(changed => { if (changed) this.applyFilters(); });
  }

  onView(row: PledgeListItem): void { this.openPledgeDialog(row, true); }
  onEdit(row: PledgeListItem): void { this.openPledgeDialog(row, false); }

  onDelete(row: PledgeListItem): void {
    if (!confirm(`Xóa hợp đồng ${row.contractCode}?`)) return;
    this.isLoading = true;
    this.pledgeService.deletePledge(row.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => { this.snack.open('Đã xóa hợp đồng', 'Đóng', { duration: 2000 }); this.applyFilters(); },
        error: () => this.snack.open('Xóa thất bại', 'Đóng', { duration: 2500 })
      });
  }

  onPrint(_: PledgeListItem): void { this.snack.open('Tính năng In đang phát triển', 'Đóng', { duration: 2000 }); }
  onShowHistory(_: PledgeListItem): void { this.snack.open('Tính năng Lịch sử đang phát triển', 'Đóng', { duration: 2000 }); }
  openLiquidationAssets(): void { this.snack.open('Tính năng Thanh lý đang phát triển', 'Đóng', { duration: 2000 }); }
}
