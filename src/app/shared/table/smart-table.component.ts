import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { SmartTableColumn, SmartTableAction, TableQuery, PagedResult } from './smart-table.types';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';

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
    MatProgressBarModule, // ✅ quan trọng
  ],
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.scss']
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
  @Input() loading = false;

  @Output() pageChange = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource: T[] = [];
  total = 0;
  displayedColumns: string[] = [];

  ngOnInit() {
    this.pageSize = this.initialPageSize || this.pageSize;
    this.displayedColumns = this.columns.map(c => c.key);
    if (this.actions?.length) this.displayedColumns.push('__actions');
    this.loadPage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fetch']?.currentValue) this.loadPage();
  }

  onPage(event: PageEvent) {
    this.pageChange.emit(event);
    this.loadPage(event.pageIndex, event.pageSize);
  }

  loadPage(pageIndex = 0, pageSize = this.pageSize) {
    if (!this.fetch) return;

    const query: TableQuery = {
      page: pageIndex,
      size: pageSize,
      sort: this.sort?.active || 'id',
      order: (this.sort?.direction as 'asc' | 'desc') || 'desc'
    };

    this.loading = true;
    this.fetch(query).subscribe({
      next: (res) => {
        this.dataSource = res.items || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.dataSource = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  reload() {
    const pageIndex = this.paginator?.pageIndex ?? 0;
    const pageSize = this.paginator?.pageSize ?? this.pageSize;
    this.loadPage(pageIndex, pageSize);
  }
  getStatusClass(status: string | null | undefined): string {
    if (!status) return 'status-default';
    const s = status.toLowerCase();
    if (s.includes('binh_thuong') || s.includes('đang vay')) return 'status-normal';
    if (s.includes('quá hạn') || s.includes('overdue')) return 'status-warning';
    if (s.includes('hủy') || s.includes('cancel')) return 'status-danger';
    if (s.includes('mới') || s.includes('new')) return 'status-info';
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
