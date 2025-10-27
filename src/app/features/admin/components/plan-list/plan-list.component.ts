import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox'; // Cần cho cột "Nổi bật"
import { MatTooltipModule } from '@angular/material/tooltip'; // Cần cho tooltip
import { MatCardModule } from '@angular/material/card'; // Import từ template
import { merge, Subject } from 'rxjs';
import { startWith, switchMap, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Service và Model đã được thay đổi
import { Plan } from '../../../../core/models/plan.model';
import { PlanService } from '../../../../core/services/plan.service';
import { NotificationService } from '../../../../core/services/notification.service';
// import { PlanDialogComponent } from '../plan-dialog/plan-dialog.component'; // (Dialog này sẽ được tạo sau)


@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule, MatDialogModule, MatSelectModule,
    MatCardModule, MatCheckboxModule, MatTooltipModule, DecimalPipe
  ],
  templateUrl: './plan-list.component.html',
  styleUrl: './plan-list.component.scss' // Sử dụng file SCSS tương tự
})
export class PlanListComponent implements AfterViewInit, OnInit {

  // Các cột hiển thị trong bảng - ĐÃ CẬP NHẬT
  displayedColumns: string[] = ['name', 'code', 'priceMonth', 'maxBranches', 'maxUsers', 'status', 'isHighlighted', 'actions'];
  dataSource = new MatTableDataSource<Plan>();

  resultsLength = 0;
  isLoading = true;
  showAdvancedSearch = false;

  // Form cho Tìm kiếm
  searchForm: FormGroup;
  // Subject để trigger tìm kiếm cơ bản
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private planService: PlanService, // Đã thay đổi
    private notification: NotificationService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    // Khởi tạo form - ĐÃ CẬP NHẬT
    this.searchForm = this.fb.group({
      basicSearch: [''],      // Tìm kiếm cơ bản (Tên, Mã)
      status: [null],         // Lọc nâng cao (Active, Inactive)
      isHighlighted: [null]   // Lọc nâng cao (Nổi bật)
    });
  }

  ngOnInit(): void {
    // Lắng nghe sự kiện gõ phím cho tìm kiếm cơ bản
    this.searchSubject.pipe(
      debounceTime(400), // Chờ 400ms sau khi gõ
      distinctUntilChanged() // Chỉ call API nếu text thay đổi
    ).subscribe(() => {
      this.paginator.pageIndex = 0; // Reset về trang đầu
      this.loadPlans(); // Gọi API
    });
  }

  ngAfterViewInit(): void {
    // Khi Sort thay đổi, reset về trang đầu
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // Lắng nghe 2 sự kiện: Sắp xếp (Sort) và Phân trang (Paginator)
    merge(this.sort.sortChange, this.paginator.page).pipe(
      startWith({}), // Bắt đầu với 1 sự kiện rỗng
      switchMap(() => {
        return this.loadPlans(); // Gọi API
      })
    ).subscribe();
  }

  /**
   * Hàm chính: Call API để lấy về danh sách
   */
  loadPlans() {
    this.isLoading = true;
    const params = this.buildApiParams();

    return this.planService.getPlans(params).pipe( // Đã thay đổi
      map(response => {
        this.isLoading = false;
        this.resultsLength = response.total;
        this.dataSource.data = response.data;
        return response.data;
      }),
      catchError((error: Error) => {
        this.isLoading = false;
        this.notification.showError(`Lỗi tải danh sách: ${error.message}`);
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
      .set('page', this.paginator.pageIndex + 1)
      .set('limit', this.paginator.pageSize)
      .set('sort', this.sort.active || 'name') // Sắp xếp mặc định theo tên
      .set('order', this.sort.direction || 'asc');

    // Tìm kiếm cơ bản
    if (formValue.basicSearch) {
      params = params.set('q', formValue.basicSearch);
    }

    // Tìm kiếm nâng cao - ĐÃ CẬP NHẬT
    if (formValue.status) {
      params = params.set('status', formValue.status);
    }
    if (formValue.isHighlighted !== null && formValue.isHighlighted !== undefined) {
      params = params.set('isHighlighted', formValue.isHighlighted);
    }

    return params;
  }

  // --- Xử lý Sự kiện ---

  /**
   * Trigger cho tìm kiếm cơ bản (từ ô input)
   */
  applyBasicSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim().toLowerCase());
  }

  /**
   * Trigger cho tìm kiếm nâng cao (từ nút bấm)
   */
  onAdvancedSearch(): void {
    this.paginator.pageIndex = 0;
    this.loadPlans(); // Chỉ cần gọi loadPlans
  }

  /**
   * Reset toàn bộ tìm kiếm
   */
  resetSearch(): void {
    this.searchForm.reset({
      basicSearch: '',
      status: null,
      isHighlighted: null
    });
    this.paginator.pageIndex = 0;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
    this.loadPlans(); // Tải lại với giá trị rỗng
  }

  /**
   * Mở Dialog Thêm mới / Chỉnh sửa
   */
  openPlanDialog(plan?: Plan): void {
    /*
    // (Bỏ comment khi bạn đã tạo PlanDialogComponent)
    const dialogRef = this.dialog.open(PlanDialogComponent, {
      width: '700px', // Form này có thể cần rộng hơn
      data: plan || {}, // Truyền dữ liệu gói (nếu là edit)
      disableClose: true // Chặn đóng khi click bên ngoài
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu dialog trả về true (lưu thành công) -> tải lại danh sách
        this.loadPlans();
      }
    });
    */
    this.notification.showSuccess('Chức năng "Thêm/Sửa Gói" đang được phát triển!');
  }

  /**
   * Xử lý Xóa
   */
  onDeletePlan(id: string, name: string): void {
    // Cần một confirm dialog đẹp hơn thay vì confirm() của trình duyệt
    if (confirm(`Bạn có chắc chắn muốn XÓA gói "${name}"? \nLƯU Ý: Nếu gói này đã có người dùng, hành động tốt nhất là chuyển sang "Ngừng cung cấp" thay vì xóa.`)) {
      this.planService.deletePlan(id).subscribe({
        next: () => {
          this.notification.showSuccess(`Đã xóa gói "${name}" thành công.`);
          // Tải lại danh sách
          this.loadPlans();
        },
        error: (error: Error) => {
          this.notification.showError(`Lỗi khi xóa: ${error.message}`);
        }
      });
    }
  }
}
