// /features/admin/pages/store-assignment/store-assignment.component.ts (ĐÃ SỬA)

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import { MatCardModule } from '@angular/material/card';
import { of } from 'rxjs';
import { switchMap, catchError, finalize, map } from 'rxjs/operators';

// === DỊCH VỤ ===
// (Đảm bảo đường dẫn chính xác)
import { UserService } from '../../../../core/services/user.service';
import { StoreService } from '../../../../core/services/store.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

// === DIALOG MỚI ===
// (Chúng ta sẽ tạo tệp này ở bước sau)
import { AssignUserDialogComponent } from '../../../../core/dialogs/assign-user-dialog/assign-user-dialog.component';

@Component({
  selector: 'app-store-assignment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatSelectModule, MatToolbarModule, MatProgressBarModule, MatMenuModule,
    MatTooltipModule, MatCardModule
  ],
  templateUrl: './store-assignment.component.html',
  styleUrl: './store-assignment.component.scss'
})
export class StoreAssignmentComponent implements OnInit {

  // Danh sách user đã gán
  displayedColumns: string[] = ['stt', 'fullName', 'phone', 'email', 'actions'];
  assignedUsersDataSource = new MatTableDataSource<any>();

  // Danh sách tiệm để chọn
  storeList: any[] = [];
  storeSelectionControl = new FormControl(null);
  selectedStore: any = null;

  isLoadingStores = false;
  isLoadingUsers = false;

  private userService = inject(UserService);
  private storeService = inject(StoreService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadStoreDropdown();

    // SỬA LỖI 4: Thêm kiểu 'any' cho biến 'store' để tránh lỗi 'never'
    this.storeSelectionControl.valueChanges.subscribe((store: any) => {
      this.selectedStore = store;
      if (store && store.id) { // Lỗi 5 (TS2339) tự hết
        this.loadUsersForStore(store.id); // Lỗi 6 (TS2339) tự hết
      } else {
        this.assignedUsersDataSource.data = [];
      }
    });
  }

  /**
   * Tải danh sách tiệm cho ô dropdown
   */
  loadStoreDropdown(): void {
    this.isLoadingStores = true;
    // Giả sử storeService có hàm getStoreDropdownList() trả về { data: [...] }
    this.storeService.getStoreDropdownList().pipe(
      map((response: any) => response.data || []),
      catchError(() => {
        this.notification.showError('Không tải được danh sách tiệm');
        return of([]);
      }),
      finalize(() => this.isLoadingStores = false)
    ).subscribe(stores => {
      this.storeList = stores;
    });
  }

  /**
   * Tải danh sách user thuộc tiệm đã chọn
   */
  loadUsersForStore(storeId: number): void {
    this.isLoadingUsers = true;
    const params = new HttpParams().set('storeId', storeId.toString());

    this.userService.getUsers(params).pipe(
      map((response: any) => response.data?.content || []),
      catchError((err: Error) => {
        this.notification.showError(err.message || 'Lỗi tải user');
        return of([]);
      }),
      finalize(() => this.isLoadingUsers = false)
    ).subscribe(users => {
      this.assignedUsersDataSource.data = users;
    });
  }

  /**
   * Mở Dialog để gán user MỚI vào tiệm
   */
  openAssignUserDialog(): void {
    const dialogRef = this.dialog.open(AssignUserDialogComponent, {
      width: '500px',
      data: {
        storeId: this.selectedStore.id,
        storeName: this.selectedStore.name
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu gán thành công, tải lại danh sách user
        this.loadUsersForStore(this.selectedStore.id);
      }
    });
  }

  /**
   * Gỡ user ra khỏi tiệm (set storeId = null)
   */
  onRemoveUser(user: any): void {
    const dialogData: ConfirmDialogData = {
      title: 'Xác nhận Gỡ User',
      message: `Bạn có chắc muốn gỡ "<b>${user.fullName}</b>" khỏi tiệm "<b>${this.selectedStore.name}</b>"?<br>User sẽ không bị xóa, chỉ bị gỡ khỏi tiệm.`,
      confirmText: 'Xác nhận Gỡ'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoadingUsers = true;

        // SỬA LỖI 6: Đổi tên hàm 'getUser' thành 'getUserById'
        this.userService.getUserById(user.userId).pipe(
          switchMap(fullUser => {
            // Lỗi TS2698 (Lỗi 7) sẽ tự hết khi Lỗi 6 được sửa
            const payload = { ...fullUser, storeId: null };
            return this.userService.updateUser(user.userId, payload);
          }),
          finalize(() => this.isLoadingUsers = false)
        ).subscribe({
          next: () => {
            this.notification.showSuccess('Gỡ user thành công.');
            this.loadUsersForStore(this.selectedStore.id); // Tải lại
          },
          error: (err: Error) => {
            this.notification.showError(err.message || 'Gỡ user thất bại');
          }
        });
      }
    });
  }
}
