// store-list.component.ts

import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // THÊM PageEvent
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // BỎ CÁI NÀY
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
// import { MatDatepickerModule } from '@angular/material/datepicker'; // Bỏ (không dùng)
// import { MatNativeDateModule } from '@angular/material/core'; // Bỏ (không dùng)
import { merge, Subject, of } from 'rxjs'; // THÊM 'of'
import { startWith, switchMap, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { Store } from '../../../../core/models/store.model';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';

// =================================================================
// === THÊM CÁC MODULE CHO GIAO DIỆN MỚI (GIỐNG LICENSE) ===
// =================================================================
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
// =================================================================


@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, /*MatProgressSpinnerModule,*/ MatDialogModule, MatSelectModule,
    // MatDatepickerModule, MatNativeDateModule, // Bỏ
    MatCardModule,

    // THÊM CÁC MODULE MỚI
    MatToolbarModule,
    MatProgressBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss'
})
export class StoreListComponent implements AfterViewInit, OnInit {

  // SỬA CÁC CỘT HIỂN THỊ (Thêm 'stt', bỏ 'phone')
  displayedColumns: string[] = ['stt', 'name', 'ownerName', 'status', 'licensePlan', 'expiryDate', 'actions'];
  dataSource = new MatTableDataSource<Store>();

  resultsLength = 0;
  isLoading = true;
  // showAdvancedSearch = false; // BỎ TÌM KIẾM NÂNG CAO

  // THÊM BIẾN CHO PAGINATOR (GIỐNG LICENSE)
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  // Form cho Tìm kiếm (SẼ ĐƯỢC ĐƠN GIẢN HÓA)
  searchForm: FormGroup;
  // Subject để trigger tìm kiếm cơ bản
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
    // ĐƠN GIẢN HÓA FORM (BỎ TÌM KIẾM NÂNG CAO)
    this.searchForm = this.fb.group({
      basicSearch: [''], // Chỉ giữ lại tìm kiếm cơ bản
      // status: [null],
      // plan: [null]
    });
  }

  ngOnInit(): void {
    const parentPath = this.route.parent?.snapshot.url[0]?.path;
    this.isAdmin = (parentPath === 'admin');

    if (!this.isAdmin) {
      // SỬA LẠI CỘT KHI KHÔNG PHẢI ADMIN
      this.displayedColumns = ['stt', 'name', 'ownerName', 'status', 'licensePlan', 'expiryDate']; // Bỏ 'actions', thêm 'stt'
    }

    // Lắng nghe sự kiện gõ phím cho tìm kiếm cơ bản
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginator.pageIndex = 0;
    });
  }

  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // Lắng nghe các sự kiện: Sắp xếp (Sort), Phân trang (Paginator), và Tìm kiếm (searchSubject)
    merge(this.sort.sortChange, this.paginator.page, this.searchSubject.pipe(debounceTime(0)))
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.loadStores();
        })
      ).subscribe();
  }

  /**
   * Hàm chính: Call API để lấy về danh sách
   */
  loadStores() {
    this.isLoading = true;
    const params = this.buildApiParams();

    return this.storeService.getStores(params).pipe(
      map((response: any) => {
        this.isLoading = false;

        // =================================================================
        // === SỬA LỖI ĐỌC API (TỪ LẦN TRƯỚC) ===
        // =================================================================
        this.resultsLength = response.data.totalElements; // Đọc từ data.totalElements
        this.dataSource.data = response.data.content;      // Đọc từ data.content
        return response.data.content;
        // =================================================================

      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(error.message);
        return of([]); // Sửa: return of([])
      })
    );
  }

  /**
   * Xây dựng HttpParams cho API (ĐÃ BỎ TÌM KIẾM NÂNG CAO)
   */
  buildApiParams(): HttpParams {
    // const formValue = this.searchForm.value; // Không cần nữa

    let params = new HttpParams()
      .set('page', this.paginator.pageIndex)
      .set('size', this.paginator.pageSize) // SỬA: Dùng 'this.pageSize'
      .set('type', this.isAdmin ? 'admin' : 'user');


    // Tìm kiếm cơ bản (q)
    const basicSearchTerm = this.searchForm.get('basicSearch')?.value;
    if (basicSearchTerm) {
      params = params.set('q', basicSearchTerm);
    }

    // BỎ LOGIC TÌM KIẾM NÂNG CAO
    // if (formValue.status) { ... }
    // if (formValue.plan) { ... }

    return params;
  }

  // --- Xử lý Sự kiện ---

  /**
   * BỎ: applyBasicSearch(event: Event)
   */
  // applyBasicSearch(event: Event): void { ... }

  /**
   * THÊM: Hàm trigger tìm kiếm từ nút bấm hoặc Enter (GIỐNG LICENSE)
   */
  applyBasicSearchTrigger(filterValue: string): void {
    const trimmedValue = filterValue.trim();
    // Cập nhật giá trị vào form control để nó đồng bộ (nếu cần)
    this.searchForm.controls.basicSearch.setValue(trimmedValue);
    // Bắn sự kiện next() để ngAfterViewInit bắt được
    this.searchSubject.next(trimmedValue);
  }

  /**
   * THÊM: Hàm xử lý sự kiện Paginator (GIỐNG LICENSE)
   */
  pageChanged(event: PageEvent): void {
    this.pageSize = event.pageSize;
  }

  /**
   * BỎ: onAdvancedSearch(): void { ... }
   */

  /**
   * BỎ: resetSearch(): void { ... }
   */

  /**
   * THÊM: Hàm lấy Class cho Status Chip (GIỐNG LICENSE, NHƯNG SỬA LOGIC)
   */
  getStatusClass(status: string): string {
    const baseClass = 'status-chip';
    switch (status?.toLowerCase()) {
      case 'active': return `${baseClass} status-completed`; // Xanh lá
      case 'trial': return `${baseClass} status-pending`;   // Cam
      case 'expired': return `${baseClass} status-default`;  // Xám
      case 'locked': return `${baseClass} status-failed`;    // Đỏ
      default: return `${baseClass} status-default`;
    }
  }

  /**
   * THÊM: Hàm lấy Text cho Status Chip (GIỐNG LICENSE, NHƯNG SỬA LOGIC)
   */
  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Đang hoạt động';
      case 'trial': return 'Dùng thử';
      case 'expired': return 'Hết hạn';
      case 'locked': return 'Bị khóa';
      default: return status || 'Không rõ';
    }
  }


  /**
   * Mở Dialog Thêm mới / Chỉnh sửa (Giữ nguyên)
   */
  openStoreDialog(store?: Store): void {
    /*
    const dialogRef = this.dialog.open(StoreDialogComponent, {
      width: '600px',
      data: store || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
      }
    });
    */
    this.notification.showSuccess('Chức năng "Thêm/Sửa" đang được phát triển!');
  }

  /**
   * Xử lý Xóa (Giữ nguyên)
   */
  onDeleteStore(id: string, name: string): void {
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
