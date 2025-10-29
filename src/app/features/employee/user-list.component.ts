// /features/admin/pages/user-list/user-list.component.ts (CẬP NHẬT)

import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
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
import { merge, Subject, of, Observable, catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

// === DỊCH VỤ ===
import { UserService } from '../../core/services/user.service'; // Sửa đường dẫn nếu cần
import { StoreService } from '../../core/services/store.service';
import { NotificationService } from '../../core/services/notification.service';

// === IMPORT DIALOGS (Bỏ comment) ===
import { UserDialogComponent } from '../../core/dialogs/user-dialog/user-dialog.component'; // Sửa đường dẫn nếu cần
import { ConfirmDialogComponent, ConfirmDialogData } from '../../core/dialogs/confirm-dialog/confirm-dialog.component'; // Sửa đường dẫn nếu cần

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDialogModule, MatSelectModule, MatToolbarModule,
    MatProgressBarModule, MatMenuModule, MatTooltipModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = ['stt', 'fullName', 'phone', 'storeName', 'actions'];
  dataSource = new MatTableDataSource<any>();

  totalElements = 0;
  isLoading = true;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  searchForm: FormGroup;
  private refreshTrigger = new Subject<void>();

  // === THAY ĐỔI: Chuyển từ Observable sang Array ===
  storeList: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private userService = inject(UserService);
  private storeService = inject(StoreService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  constructor() {
    this.searchForm = this.fb.group({
      basicSearch: [''],
      storeId: [null],
      role: [null] // <-- 1. THÊM MỚI
    });
  }

  ngOnInit(): void {
    this.loadStoreDropdown(); // Tải danh sách tiệm

    // Khi thay đổi bộ lọc, tải lại
    this.searchForm.get('storeId')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(() => {
      if (this.paginator) this.paginator.pageIndex = 0;
      this.refreshTrigger.next();
    });

    // <-- 2. THÊM MỚI: Lắng nghe thay đổi của bộ lọc role -->
    this.searchForm.get('role')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(() => {
      if (this.paginator) this.paginator.pageIndex = 0;
      this.refreshTrigger.next();
    });
    // <-- KẾT THÚC THÊM MỚI (2) -->
  }

  ngAfterViewInit(): void {
    merge(this.sort.sortChange, this.paginator.page, this.refreshTrigger)
      .pipe(
        startWith({}),
        switchMap(() => this.loadUsers())
      ).subscribe(data => {
      this.dataSource.data = data;
    });
  }

  /**
   * === CẬP NHẬT (3): Xử lý API response có object 'data' ===
   */
  loadStoreDropdown(): void {
    this.storeService.getStoreDropdownList().pipe(
      map((response: any) => response.data || []), // <-- SỬA Ở ĐÂY: Trích xuất mảng 'data'
      catchError(() => {
        this.notification.showError('Không tải được danh sách cửa hàng');
        return of([]);
      })
    ).subscribe((stores: any[]) => {
      this.storeList = stores;
    });
  }

  loadUsers() {
    this.isLoading = true;
    const params = this.buildApiParams();

    return this.userService.getUsers(params).pipe(
      map((response: any) => {
        this.isLoading = false;
        this.totalElements = response.data.totalElements;
        return response.data.content;
      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(error.message);
        return of([]);
      })
    );
  }

  buildApiParams(): HttpParams {
    let params = new HttpParams()
      .set('page', this.paginator.pageIndex)
      .set('size', this.paginator.pageSize);

    if (this.sort && this.sort.active && this.sort.direction) {
      params = params.set('sort', `${this.sort.active},${this.sort.direction}`);
    }

    const basicSearchTerm = this.searchForm.get('basicSearch')?.value;
    if (basicSearchTerm) params = params.set('q', basicSearchTerm);

    const storeId = this.searchForm.get('storeId')?.value;
    if (storeId) params = params.set('storeId', storeId);

    // <-- 4. THÊM MỚI: Thêm tham số 'role' -->
    const role = this.searchForm.get('role')?.value;
    if (role) {
      params = params.set('role', role);
    }
    // <-- KẾT THÚC THÊM MỚI (4) -->

    return params;
  }

  applySearch(): void {
    if (this.paginator) this.paginator.pageIndex = 0;
    this.refreshTrigger.next();
  }

  announceSortChange(sortState: Sort): void {
    // Logic đã được xử lý trong ngAfterViewInit
  }


  /**
   * === CẬP NHẬT: Triển khai Thêm/Sửa ===
   */
  openUserDialog(row?: any): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: {
        row: row, // Truyền 'row' (sẽ là undefined nếu Thêm mới)
        storeList: this.storeList // Truyền danh sách tiệm đã tải
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.refreshTrigger.next(); // Tải lại bảng nếu lưu thành công
      }
    });
  }

  /**
   * === CẬP NHẬT: Triển khai Xóa ===
   */
  onDeleteUser(row: any): void {
    const dialogData: ConfirmDialogData = {
      title: 'Xác nhận Xóa Người dùng',
      message: `Bạn có chắc chắn muốn XÓA người dùng "<b>${row.fullName}</b>"?<br>Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận Xóa'
    };

    // (Giả sử bạn đã import ConfirmDialogComponent)
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.userService.deleteUser(row.userId).subscribe({
          next: () => {
            this.notification.showSuccess('Đã xóa người dùng thành công.');
            this.refreshTrigger.next(); // Tải lại bảng
          },
          error: (err: Error) => {
            this.notification.showError(err.message || 'Xóa thất bại.');
          }
        });
      }
    });
  }
}
