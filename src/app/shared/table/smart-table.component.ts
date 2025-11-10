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
    MatButtonModule
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
}
