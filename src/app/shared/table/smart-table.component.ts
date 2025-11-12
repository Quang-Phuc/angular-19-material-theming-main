import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges,
  ViewChild, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SmartTableColumn, SmartTableAction, TableQuery, PagedResult } from './smart-table.types';

@Component({
  selector: 'app-smart-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule
  ],
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartTableComponent<T> implements OnInit, OnChanges {
  @Input() columns: SmartTableColumn<T>[] = [];
  @Input() actions: SmartTableAction<T>[] = [];
  @Input() fetch!: (query: TableQuery) => Observable<PagedResult<T>>;
  @Input() initialPageSize = 10;
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() usePaginator = true;
  @Input() placeholder = 'Không có dữ liệu';

  @Output() pageChange = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource: T[] = [];
  total = 0;
  loading = false;
  displayedColumns: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  // ✅ Khởi tạo bảng
  ngOnInit() {
    this.setupDisplayedColumns();
    this.loadPage(0, this.initialPageSize);
  }

  // ✅ Khi input thay đổi (vd. columns, fetch)
  ngOnChanges(changes: SimpleChanges) {
    if (changes['columns'] && this.columns?.length) {
      this.setupDisplayedColumns();
    }
    if (changes['fetch']?.currentValue) {
      this.reload();
    }
  }

  private setupDisplayedColumns() {
    this.displayedColumns = this.columns.map(c => c.key);
    if (this.actions?.length) this.displayedColumns.push('__actions');
  }

  onPage(event: PageEvent) {
    this.pageChange.emit(event);
    this.loadPage(event.pageIndex, event.pageSize);
  }

  // ✅ Load dữ liệu + detectChanges() để hiển thị ngay
  loadPage(pageIndex = 0, pageSize = this.initialPageSize) {
    if (!this.fetch) return;

    const query: TableQuery = {
      page: pageIndex,
      size: pageSize,
      sort: this.sort?.active || 'id',
      order: (this.sort?.direction as 'asc' | 'desc') || 'desc'
    };

    this.loading = true;
    this.cdr.markForCheck(); // hiển thị progress bar ngay

    this.fetch(query)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges(); // ép Angular render lại lập tức
      }))
      .subscribe({
        next: (res) => {
          this.dataSource = res.items ?? [];
          this.total = res.total ?? 0;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.dataSource = [];
          this.total = 0;
        }
      });
  }

  reload() {
    const pageIndex = this.paginator?.pageIndex ?? 0;
    const pageSize = this.paginator?.pageSize ?? this.initialPageSize;
    this.loadPage(pageIndex, pageSize);
  }

  // ✅ Helper cho status (nếu cần)
  getStatusClass(status: string | null | undefined): string {
    if (!status) return 'status-default';
    const s = status.toLowerCase();
    if (s.includes('paid')) return 'status-done';
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('overdue')) return 'status-warning';
    return 'status-default';
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Không xác định';
    switch (status.toUpperCase()) {
      case 'BINH_THUONG': return 'Bình thường';
      case 'QUÁ HẠN': return 'Quá hạn';
      case 'HUY': return 'Huỷ';
      default: return status;
    }
  }

  getStatusIcon(status: string | null | undefined): string | null {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes('binh_thuong') || s.includes('đang vay')) return 'check_circle';
    if (s.includes('quá hạn') || s.includes('overdue')) return 'warning';
    if (s.includes('hủy') || s.includes('cancel')) return 'cancel';
    if (s.includes('mới') || s.includes('new')) return 'fiber_new';
    return null;
  }

}
