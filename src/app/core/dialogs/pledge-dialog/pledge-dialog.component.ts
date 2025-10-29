import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { NotificationService } from '../../services/notification.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service'; // Import service
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressBarModule, DatePipe
  ],
  templateUrl: './pledge-dialog.component.html',
  styleUrl: './pledge-dialog.component.scss'
})
export class PledgeDialogComponent implements OnInit {

  pledgeForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  // Dữ liệu giả lập cho Loại tài sản
  assetTypes$: Observable<string[]> = of(['Xe Máy', 'Ô tô', 'Điện thoại', 'Laptop', 'Vàng/Trang sức']);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);
  @Inject(MAT_DIALOG_DATA) public data: PledgeContract | null = inject(MAT_DIALOG_DATA);
  private notification = inject(NotificationService);
  private pledgeService = inject(PledgeService);
  private datePipe = inject(DatePipe);

  constructor() {
    this.isEditMode = !!this.data; // Nếu có data truyền vào là chế độ Sửa

    this.pledgeForm = this.fb.group({
      // 1. Thông tin khách vay
      customerInfo: this.fb.group({
        hoTen: ['', Validators.required],
        ngaySinh: [null],
        soCCCD: [''],
        soDienThoai: ['', Validators.required],
        diaChi: [''],
        ngayCapCCCD: [null]
      }),
      // 2. Thông tin cho vay
      loanInfo: this.fb.group({
        tenTaiSan: ['', Validators.required],
        loaiTaiSan: ['', Validators.required],
        ngayVay: [new Date(), Validators.required],
        maHopDong: [''], // API có thể tự sinh
        tongTienVay: [0, [Validators.required, Validators.min(1000)]],
        kyDongLai_So: [1, Validators.required],
        kyDongLai_DonVi: ['Thang', Validators.required],
        laiSuat_So: [0, Validators.required],
        laiSuat_DonVi: ['PhanTram', Validators.required],
        soLanTra: [1],
        kieuThuLai: ['Truoc', Validators.required],
        ghiChu: ['']
      }),
      // 3. Các accordion khác (đơn giản hóa)
      feesInfo: this.fb.group({}),
      collateralInfo: this.fb.group({}),
      attachments: this.fb.group({})
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data) {
      this.patchFormData(this.data);
    }
  }

  /**
   * Điền dữ liệu vào form khi ở chế độ Sửa
   */
  patchFormData(contract: PledgeContract): void {
    this.pledgeForm.patchValue({
      customerInfo: {
        hoTen: contract.customer.hoTen,
        ngaySinh: contract.customer.ngaySinh ? new Date(contract.customer.ngaySinh) : null,
        soCCCD: contract.customer.soCCCD,
        soDienThoai: contract.customer.soDienThoai,
        diaChi: contract.customer.diaChi,
        ngayCapCCCD: contract.customer.ngayCapCCCD ? new Date(contract.customer.ngayCapCCCD) : null
      },
      loanInfo: {
        tenTaiSan: contract.loan.tenTaiSan,
        loaiTaiSan: contract.loan.loaiTaiSan,
        ngayVay: new Date(contract.loan.ngayVay),
        maHopDong: contract.id, // Dùng ID làm mã HĐ
        tongTienVay: contract.loan.tongTienVay,
        kyDongLai_So: contract.loan.kyDongLai_So,
        kyDongLai_DonVi: contract.loan.kyDongLai_DonVi,
        laiSuat_So: contract.loan.laiSuat_So,
        laiSuat_DonVi: contract.loan.laiSuat_DonVi,
        soLanTra: contract.loan.soLanTra,
        kieuThuLai: contract.loan.kieuThuLai,
        ghiChu: contract.loan.ghiChu
      }
    });

    // Khóa trường Mã Hợp Đồng khi sửa
    this.pledgeForm.get('loanInfo.maHopDong')?.disable();
  }

  /**
   * Xử lý lưu
   */
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched(); // Hiển thị lỗi
      return;
    }

    this.isLoading = true;

    // Chuẩn bị dữ liệu
    const formData = this.pledgeForm.getRawValue();
    const payload: PledgeContract = {
      id: this.isEditMode ? this.data?.id : undefined,
      customer: {
        ...formData.customerInfo,
        ngaySinh: this.formatDate(formData.customerInfo.ngaySinh),
        ngayCapCCCD: this.formatDate(formData.customerInfo.ngayCapCCCD)
      },
      loan: {
        ...formData.loanInfo,
        ngayVay: this.formatDate(formData.loanInfo.ngayVay)!,
      }
      // TODO: Thêm dữ liệu từ các accordion khác
    };

    // Gọi API
    const saveObservable = this.isEditMode
      ? this.pledgeService.updatePledge(this.data!.id!, payload)
      : this.pledgeService.createPledge(payload);

    // Xử lý kết quả (Giả lập, vì service chưa gọi API thật)
    this.notification.showSuccess(this.isEditMode ? 'Cập nhật hợp đồng thành công!' : 'Thêm mới hợp đồng thành công!');
    this.isLoading = false;
    this.dialogRef.close(true); // Đóng dialog và trả về 'true' để list component refresh

    /*
    // --- CODE THẬT KHI CÓ API ---
    saveObservable.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notification.showSuccess(this.isEditMode ? 'Cập nhật hợp đồng thành công!' : 'Thêm mới hợp đồng thành công!');
        this.dialogRef.close(true); // Đóng dialog và trả về 'true' để list component refresh
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.showError(err.message || 'Đã xảy ra lỗi khi lưu hợp đồng.');
      }
    });
    */
  }

  /**
   * Xử lý đóng dialog
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Helper format ngày sang YYYY-MM-DD
   */
  private formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }

  // TODO: Thêm hàm tìm kiếm khách hàng, thêm loại tài sản
  findCustomer(): void {
    this.notification.showInfo('Chức năng tìm kiếm khách hàng đang phát triển.');
  }

  addNewAssetType(): void {
    this.notification.showInfo('Chức năng thêm loại tài sản đang phát triển.');
  }
}
