import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { merge, Subject, of } from 'rxjs';
import { startWith, switchMap, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

// import { Store } from '../../../../core/models/store.model'; // Tạm thời không cần ép kiểu
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';

// CÁC MODULE GIAO DIỆN MỚI
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
// import { MatChipsModule } from '@angular/material/chips'; // Đã bỏ
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDialogModule, MatSelectModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss'
})
export class StoreListComponent implements AfterViewInit, OnInit {

  // === SỬA Ở ĐÂY: DÙNG TÊN TRỰC TIẾP TỪ API ===
  displayedColumns: string[] = ['stt', 'storeName', 'userFullName', 'actions'];
  dataSource = new MatTableDataSource<any>(); // Dùng kiểu 'any' để linh hoạt

  resultsLength = 0;
  isLoading = true;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  searchForm: FormGroup;
  private searchSubject = new Subject<string>();

  public isAdmin: boolean = false;
  private route = inject(ActivatedRoute);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private storeService: StoreService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      basicSearch: [''],
    });
  }

  ngOnInit(): void {
    const parentPath = this.route.parent?.snapshot.url[0]?.path;
    this.isAdmin = (parentPath === 'admin');

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginator.pageIndex = 0;
    });
  }

  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page, this.searchSubject.pipe(debounceTime(0)))
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.loadStores();
        })
      ).subscribe();
  }

  /**
   * Hàm chính: Call API
   */
  loadStores() {
    this.isLoading = true;
    const params = this.buildApiParams();

    return this.storeService.getStores(params).pipe(
      map((response: any) => {
        this.isLoading = false;

        if (!response || !response.data || !response.data.content) {
          this.resultsLength = 0;
          this.dataSource.data = [];
          return [];
        }

        this.resultsLength = response.data.totalElements;

        // === SỬA Ở ĐÂY: GÁN TRỰC TIẾP, KHÔNG MAP ===
        this.dataSource.data = response.data.content;

        return response.data.content;
      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(error.message);
        return of([]);
      })
    );
  }

  /**
   * Xây dựng HttpParams cho API
   */
  buildApiParams(): HttpParams {
    let params = new HttpParams()
      .set('page', this.paginator.pageIndex)
      .set('size', this.paginator.pageSize)
      .set('type', this.isAdmin ? 'admin' : 'user');

    const basicSearchTerm = this.searchForm.get('basicSearch')?.value;
    if (basicSearchTerm) {
      params = params.set('q', basicSearchTerm);
    }

    return params;
  }

  applyFilterFromInput(filterValue: string): void {
    const trimmedValue = filterValue.trim();
    this.searchForm.get('basicSearch')?.setValue(trimmedValue);
    this.searchSubject.next(trimmedValue);
  }

  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
  }

  /**
   * Mở Dialog
   */
  openStoreDialog(row?: any): void {
    // Khi dùng, bạn sẽ truyền row.storeId, row.storeName,...
    this.notification.showSuccess('Chức năng "Thêm/Sửa" đang được phát triển!');
  }

  /**
   * Xử lý Xóa
   */
  onDeleteStore(row: any): void {
    // === SỬA Ở ĐÂY: Lấy ID và Tên từ API response ===
    const id = row.storeId;
    const name = row.storeName;

    if (confirm(`Bạn có chắc chắn muốn XÓA tiệm "${name}"? Hành động này không thể hoàn tác.`)) {
      this.storeService.deleteStore(id).subscribe({
        next: () => {
          this.notification.showSuccess(`Đã xóa tiệm "${name}" thành công.`);
          this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
        },
        error: (error: Error) => {
          this.notification.showError(error.message);
        }
      });
    }
  }
}
