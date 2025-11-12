// src/app/features/users/pledge-list/pledge-list.component.ts
import {
  Component, ChangeDetectionStrategy, OnInit, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { CloseInterestDialogComponent } from '../interest/close-interest-dialog/close-interest-dialog/close-interest-dialog.component'; // điều chỉnh path đúng dự án m

import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { SmartTableComponent } from '../../../shared/table/smart-table.component';
import {
  SmartTableColumn,
  SmartTableAction,
  TableQuery,
  PagedResult,
} from '../../../shared/table/smart-table.types';

import { ApiService } from '../../../core/services/api.service';
import { ResourceFactory } from '../../../core/services/resource-factory.service';
import {
  ApiResponse, ApiPage, ApiListResponse, isApiPage, unwrapData
} from '../../../core/models/api.model';
import { NotificationService } from '../../../core/services/notification.service';
import { PledgeDialogComponent } from '../../../core/dialogs/pledge-dialog/pledge-dialog.component';
import { PledgeService } from '../../../core/services/pledge.service';

interface StoreItem { storeId: string; storeName: string; }
interface ApiStore { id: number | string; name: string; }
interface UserStore { id: string | number; fullName: string; }

interface PledgeRow {
  id: number;
  storeId?: string | number;

  contractCode: string;
  customerName: string;
  assetName: string;

  loanDate?: string | Date;
  dueDate?: string | Date;
  loanAmount?: number;
  totalPaid?: number;
  remainingPrincipal?: number;
  status?: string;
  follower?: string;
  pledgeStatus?: string;

  // các field có thể có thêm tuỳ backend
}

@Component({
  selector: 'app-pledge-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatToolbarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatOptionModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule, MatBadgeModule,
    SmartTableComponent
  ],
  templateUrl: './pledge-list.component.html',
  styleUrls: ['./pledge-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PledgeListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private resources = inject(ResourceFactory);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  @ViewChild('table') table!: SmartTableComponent<PledgeRow>;

  filterForm: FormGroup = this.fb.group({
    keyword: [''],
    loanStatus: [''],
    pledgeState: [''],
    fromDate: [null],
    toDate: [null],
    follower: ['']
  });

  constructor(private pledgeService: PledgeService) {}

  selectedStoreId: string | null = null;

  storeList$!: Observable<StoreItem[]>;
  followerList$!: Observable<UserStore[]>;

  columns: SmartTableColumn<PledgeRow>[] = [
    { key: 'contractCode', header: 'Mã HĐ', sortable: true, width: '140px' },
    { key: 'customerName', header: 'Khách hàng', sortable: true },
    { key: 'assetName', header: 'Tài sản', sortable: true },
    { key: 'loanAmount', header: 'Số tiền vay', type: 'number', align: 'end', sortable: true, width: '120px' },
    { key: 'totalPaid', header: 'Đã trả', type: 'number', align: 'end', sortable: true, width: '110px' },
    { key: 'remainingPrincipal', header: 'Còn lại', type: 'number', align: 'end', sortable: true, width: '110px' },
    { key: 'pledgeStatus', header: 'Tình trạng', sortable: true, width: '110px' }
  ];

  rowActions: SmartTableAction<PledgeRow>[] = [
    { icon: 'visibility', tooltip: 'Xem', handler: (row) => this.viewPledge(row.id) },
    { icon: 'edit', tooltip: 'Sửa', color: 'primary', handler: (row) => this.editPledge(row.id) },
    { icon: 'print', tooltip: 'In', handler: (row) => this.onPrint(row) },
    { icon: 'history', tooltip: 'Lịch sử', handler: (row) => this.onShowHistory(row) },
    { icon: 'payments', tooltip: 'Đóng lãi', color: 'accent', handler: (row) => this.onCloseInterest(row.id) }, // ✅ thêm dòng này
    { icon: 'delete', tooltip: 'Xoá', color: 'warn', handler: (row) => this.onDelete(row) },
  ];

  /** ✅ fetch 1-2 dòng: dùng common pagePagedResult */
  fetch = (q: TableQuery): Observable<PagedResult<PledgeRow>> => {
    const fv = this.filterForm.value;
    const params: Record<string, any> = {
      page: q.page, size: q.size, sort: q.sort, order: q.order,
      keyword: (fv.keyword ?? '').trim() || q.keyword || undefined,
      loanStatus: fv.loanStatus || undefined,
      pledgeState: fv.pledgeState || undefined,
      follower: fv.follower || undefined,
      storeId: this.selectedStoreId || undefined,
      fromDate: this.toISO(fv.fromDate),
      toDate: this.toISO(fv.toDate),
    };
    return this.resources.of<PledgeRow>('/v1/pledges').pagePagedResult(params);
  };

  ngOnInit(): void {
    this.loadStoreDropdown();
  }

  private loadStoreDropdown(): void {
    this.storeList$ = this.resources
      .of<ApiStore>('/v1/stores/dropdown')
      .list()
      .pipe(
        map((res: ApiListResponse<ApiStore>) => (res?.data ?? []).map(s => ({
          storeId: String(s.id),
          storeName: s.name
        })) as StoreItem[]),
        catchError(err => {
          console.error(err);
          this.notify.showError('Lỗi tải cửa hàng');
          return of<StoreItem[]>([]);
        })
      );

    this.storeList$.pipe(take(1)).subscribe(stores => {
      if (stores.length > 0 && !this.selectedStoreId) {
        this.selectedStoreId = stores[0].storeId;
        this.loadFollowers();
        this.reloadTable(true);
      }
    });
  }

  private loadFollowers(): void {
    if (!this.selectedStoreId) { this.followerList$ = of([]); return; }

    this.followerList$ = this.api
      .get<ApiResponse<UserStore[] | ApiPage<UserStore>>>(`/users-stores/store/${this.selectedStoreId}`)
      .pipe(
        map(res => {
          const d = unwrapData(res);
          if (isApiPage<UserStore>(d)) return d.content;
          if (Array.isArray(d)) return d;
          return [];
        }),
        catchError(err => {
          console.error(err);
          this.notify.showError('Lỗi tải người theo dõi');
          return of<UserStore[]>([]);
        })
      );
  }

  onStoreChange(): void {
    this.loadFollowers();
    this.filterForm.patchValue({ follower: '' }, { emitEvent: false });
    this.reloadTable(true);
  }

  applyFilters(): void { this.reloadTable(true); }

  resetFilters(): void {
    this.filterForm.reset({
      keyword: '',
      loanStatus: '',
      pledgeState: '',
      fromDate: null,
      toDate: null,
      follower: ''
    });
    this.reloadTable(true);
  }

  onFollowerChange(_: any): void { this.reloadTable(true); }

  viewPledge(id: number): void {
    this.pledgeService.getPledgeById(id).subscribe({
      next: (res) => {
        this.dialog.open(PledgeDialogComponent, {
          width: '1080px',
          maxWidth: '98vw',
          data: {
            mode: 'view',
            pledgeData: res,
          },
        });
      },
      error: (err) => console.error('View error', err),
    });
  }
  editPledge(id: number): void {
    this.pledgeService.getPledgeById(id).subscribe({
      next: (res) => {
        this.dialog.open(PledgeDialogComponent, {
          width: '1080px',
          maxWidth: '98vw',
          data: {
            mode: 'edit',
            pledgeData: res,
          },
        });
      },
      error: (err) => console.error('Edit error', err),
    });
  }

  onCloseInterest(id: number): void {
    this.dialog.open(CloseInterestDialogComponent, {
      width: '95vw',        // ✅ 95% chiều rộng viewport
      maxWidth: '95vw',     // ✅ đảm bảo không vượt quá màn hình
      height: '90vh',       // ✅ thêm chiều cao nếu muốn full hơn
      maxHeight: '90vh',
      panelClass: 'interest-dialog', // ✅ có thể custom CSS riêng
      data: { pledgeId: id },
    });
  }

  onPrint(_row: PledgeRow): void { this.notify.show('Tính năng In đang phát triển'); }
  onShowHistory(_row: PledgeRow): void { this.notify.show('Tính năng Lịch sử đang phát triển'); }

  onDelete(row: PledgeRow): void {
    if (!confirm(`Xoá hợp đồng ${row.contractCode}?`)) return;
    this.notify.showSuccess('Đã xoá (demo)');
  }

  openPledgeDialog(row?: PledgeRow, viewMode = false): void {
    const ref = this.dialog.open(PledgeDialogComponent, {
      width: '1080px',
      maxWidth: '98vw',
      data: {
        contractId: row?.id ?? null,
        storeId: row?.storeId ?? this.selectedStoreId ?? null,
        viewMode
      }
    });
    ref.afterClosed().subscribe(changed => { if (changed) this.reloadTable(); });
  }

  private reloadTable(resetToFirst = false): void {
    if (!this.table) return;
    const t: any = this.table;
    if (resetToFirst && typeof t.firstPage === 'function') t.firstPage();
    if (typeof t.reload === 'function') t.reload();
  }

  private toISO(d: any): string | undefined {
    if (!d) return undefined;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(+date)) return undefined;

    // ✅ Loại bỏ "Z", giữ dạng cục bộ (Spring parse được LocalDateTime)
    return date.toISOString().split('.')[0]; // "2025-11-23T17:00:00"
  }

}
