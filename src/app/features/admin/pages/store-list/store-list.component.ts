import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core'; // Thêm 'inject'
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { merge, Subject } from 'rxjs';
import { startWith, switchMap, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router'; // <-- *** 1. THÊM IMPORT ROUTE ***

import { Store } from '../../../../core/models/store.model';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule, MatDialogModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCardModule
  ],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss'
})
export class StoreListComponent implements AfterViewInit, OnInit {

  // Các cột hiển thị trong bảng
  displayedColumns: string[] = ['name', 'ownerName', 'phone', 'status', 'licensePlan', 'expiryDate', 'actions'];
  dataSource = new MatTableDataSource<Store>();

  resultsLength = 0;
  isLoading = true;
  showAdvancedSearch = false;

  // Form cho Tìm kiếm
  searchForm: FormGroup;
  // Subject để trigger tìm kiếm cơ bản
  private searchSubject = new Subject<string>();

  // *** 2. THÊM BIẾN PHÂN QUYỀN ***
  public isAdmin: boolean = false;
  private route = inject(ActivatedRoute); // Inject route

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private storeService: StoreService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    // Khởi tạo form
    this.searchForm = this.fb.group({
      basicSearch: [''], // Tìm kiếm cơ bản
      status: [null],     // Tìm kiếm nâng cao
      plan: [null]
    });
  }

  ngOnInit(): void {
    // *** 3. KIỂM TRA QUYỀN ADMIN ***
    const parentPath = this.route.parent?.snapshot.url[0]?.path;
    this.isAdmin = (parentPath === 'admin');

    // Nếu không phải admin, ẩn cột "Hành động"
    if (!this.isAdmin) {
      this.displayedColumns = ['name', 'ownerName', 'phone', 'status', 'licensePlan', 'expiryDate']; // Bỏ 'actions'
    }

    // Lắng nghe sự kiện gõ phím cho tìm kiếm cơ bản
    this.searchSubject.pipe(
      debounceTime(400), // Chờ 400ms sau khi gõ
      distinctUntilChanged() // Chỉ call API nếu text thay đổi
    ).subscribe(() => {
      this.paginator.pageIndex = 0; // Reset về trang đầu
      // Đã chuyển loadStores() sang AfterViewInit
    });
  }

  ngAfterViewInit(): void {
    // Khi Sort thay đổi, reset về trang đầu
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // Lắng nghe 2 sự kiện: Sắp xếp (Sort) và Phân trang (Paginator)
    merge(this.sort.sortChange, this.paginator.page, this.searchSubject.pipe(debounceTime(0))) // Thêm searchSubject
      .pipe(
        startWith({}), // Bắt đầu với 1 sự kiện rỗng
        switchMap(() => {
          return this.loadStores(); // Gọi API
        })
      ).subscribe();
  }

  /**
   * Hàm chính: Call API để lấy về danh sách
   */
  loadStores() {
    this.isLoading = true;
    const params = this.buildApiParams(); // Hàm này đã được cập nhật

    return this.storeService.getStores(params).pipe(
      map(response => {
        this.isLoading = false;
        this.resultsLength = response.total; // Tổng số bản ghi
        this.dataSource.data = response.data; // Gán dữ liệu cho dataSource
        return response.data; // Dữ liệu cho bảng
      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(error.message);
        return [];
      })
    );
  }

  /**
   * Xây dựng HttpParams cho API (Kết hợp cả tìm kiếm cơ bản & nâng cao)
   */
  buildApiParams(): HttpParams {
    const formValue = this.searchForm.value;

    let params = new HttpParams()
      .set('page', this.paginator.pageIndex) // Paginator (0-based)
      .set('size', this.paginator.pageSize)

    // *** 4. THÊM THAM SỐ 'TYPE' VÀO API ***
    // Gửi vai trò (admin/user) để backend lọc
    params = params.set('type', this.isAdmin ? 'admin' : 'user');


    // Tìm kiếm cơ bản (q)
    const basicSearchTerm = this.searchForm.get('basicSearch')?.value;
    if (basicSearchTerm) {
      params = params.set('q', basicSearchTerm);
    }

    // Tìm kiếm nâng cao
    if (formValue.status) {
      params = params.set('status', formValue.status);
    }
    if (formValue.plan) {
      params = params.set('plan', formValue.plan);
    }

    return params;
  }

  // --- Xử lý Sự kiện ---

  /**
   * Trigger cho tìm kiếm cơ bản (từ ô input)
   */
  applyBasicSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim()); // Bỏ toLowerCase() nếu API là case-sensitive
  }

  /**
   * Trigger cho tìm kiếm nâng cao (từ nút bấm)
   */
  onAdvancedSearch(): void {
    this.paginator.pageIndex = 0;
    // Chỉ cần trigger 1 trong các stream merge() là được
    // (Trong trường hợp này, 'merge' đã lắng nghe sortChange, page, và searchSubject)
    // Cách đơn giản nhất là trigger searchSubject
    this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
  }

  /**
   * Reset toàn bộ tìm kiếm
   */
  resetSearch(): void {
    this.searchForm.reset();
    this.searchSubject.next(''); // Trigger tìm kiếm cơ bản (với chuỗi rỗng)
  }

  /**
   * Mở Dialog Thêm mới / Chỉnh sửa
   */
  openStoreDialog(store?: Store): void {
    /*
    const dialogRef = this.dialog.open(StoreDialogComponent, {
      width: '600px',
      data: store || {} // Truyền dữ liệu tiệm (nếu là edit)
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu dialog trả về true (lưu thành công) -> tải lại danh sách
        this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
      }
    });
    */
    this.notification.showSuccess('Chức năng "Thêm/Sửa" đang được phát triển!');
  }

  /**
   * Xử lý Xóa
   */
  onDeleteStore(id: string, name: string): void {
    if (confirm(`Bạn có chắc chắn muốn XÓA tiệm "${name}"? Hành động này không thể hoàn tác.`)) {
      this.storeService.deleteStore(id).subscribe({
        next: () => {
          this.notification.showSuccess(`Đã xóa tiệm "${name}" thành công.`);
          // Tải lại danh sách
          this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
        },
        error: (error: Error) => {
          this.notification.showError(error.message);
        }
      });
    }
  }
}
