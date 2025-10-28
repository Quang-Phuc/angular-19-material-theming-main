// store-list.component.ts (ĐÃ CẬP NHẬT)

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
import { MatTooltipModule } from '@angular/material/tooltip';

// === IMPORT CÁC DIALOG MỚI ===
// (Hãy đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn)
import { StoreDialogComponent } from '../../../../core/dialogs/store-dialog/store-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

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
    // Không cần import dialogs ở đây nếu chúng là standalone và được mở bằng service
  ],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss'
})
export class StoreListComponent implements AfterViewInit, OnInit {

  // === THÊM 2 CỘT MỚI VÀO ĐÂY ===
  displayedColumns: string[] = ['stt', 'storeName', 'userFullName', 'storeAddress', 'notes', 'actions'];
  dataSource = new MatTableDataSource<any>();

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
   * === ĐÃ SỬA: Mở Dialog Thêm/Sửa ===
   */
  openStoreDialog(row?: any): void {
    const dialogRef = this.dialog.open(StoreDialogComponent, {
      width: '500px',
      data: row, // Truyền 'row' vào dialog. Sẽ là 'undefined' khi Thêm mới
      disableClose: true // Không cho đóng khi bấm bên ngoài
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu dialog trả về 'true' (lưu thành công), refresh lại bảng
        this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
      }
    });
  }

  /**
   * === ĐÃ SỬA: Xử lý Xóa dùng Confirm Dialog ===
   */
  onDeleteStore(row: any): void {
    const id = row.storeId;
    const name = row.storeName;

    const dialogData: ConfirmDialogData = {
      title: 'Xác nhận Xóa Tiệm',
      message: `Bạn có chắc chắn muốn XÓA tiệm "<b>${name}</b>"?<br>Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận Xóa'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu người dùng bấm "Xác nhận Xóa"
        this.storeService.deleteStore(id).subscribe({
          next: () => {
            this.notification.showSuccess(`Đã xóa tiệm "${name}" thành công.`);
            // Refresh lại bảng
            this.searchSubject.next(this.searchForm.get('basicSearch')?.value || '');
          },
          error: (error: Error) => {
            this.notification.showError(error.message);
          }
        });
      }
    });
  }
}
