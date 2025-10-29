// *** ĐẢM BẢO DÒNG NÀY ĐƯỢC IMPORT ĐẦU TIÊN ***
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';

import { NotificationService } from '../../services/notification.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service'; // Import service
import { Observable, of } from 'rxjs';

// Interface giả lập cho các dropdown
interface DropdownOption { id: string; name: string; }
interface FamilyMember { hoTen: string; soDienThoai: string; ngheNghiep: string; }

// *** DECORATOR @Component NẰM Ở ĐÂY ***
@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressBarModule, MatTabsModule, MatRadioModule
  ],
  templateUrl: './pledge-dialog.component.html',
  styleUrl: './pledge-dialog.component.scss',
  providers: [ DatePipe ]
})
export class PledgeDialogComponent implements OnInit {

  pledgeForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  // === DỮ LIỆU GIẢ LẬP CHO CÁC DROPDOWN MỚI ===
  assetTypes$: Observable<string[]> = of(['Xe Máy', 'Ô tô', 'Điện thoại', 'Laptop', 'Vàng/Trang sức']);

  // Tab "Thông tin cho vay"
  tinhTrangList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  doiTacList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' }, { id: 'nguoi_theo_doi', name: 'Người theo dõi' },
    { id: 'all', name: 'Tất cả' }, { id: 'huebntest', name: 'huebntest' }, { id: 'hue_2', name: 'Huệ 2' },
    { id: 'an', name: 'an' }, { id: 'nguyen_a', name: 'Nguyễn A' }
  ]);
  nguonKhachHangList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);

  // Accordion "Thông tin tài sản"
  khoList$: Observable<DropdownOption[]> = of([{ id: 'kho_1', name: 'Kho 1' }, { id: 'kho_2', name: 'Kho 2' }]);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);
  @Inject(MAT_DIALOG_DATA) public data: PledgeContract | null = inject(MAT_DIALOG_DATA);
  private notification = inject(NotificationService);
  private pledgeService = inject(PledgeService);
  private datePipe = inject(DatePipe);

  constructor() {
    this.isEditMode = !!this.data;

    this.pledgeForm = this.fb.group({
      // 1. Thông tin khách vay (Chính)
      customerInfo: this.fb.group({
        hoTen: ['', Validators.required],
        ngaySinh: [null],
        soCCCD: [''],
        soDienThoai: ['', Validators.required],
        diaChi: [''],
        ngayCapCCCD: [null],
        noiCapCCCD: [''] // <-- MỚI
      }),

      // 1b. Tab Thông tin khác (Khách hàng)
      customerExtraInfo: this.fb.group({
        maKhachHang: [''],
        ngheNghiep: [''],
        noiLamViec: [''],
        hoKhau: [''],
        email: ['', [Validators.email]],
        thuNhap: [0],
        ghiChu: ['']
      }),

      // 1c. Tab Thành phần gia đình & Liên hệ
      familyInfo: this.fb.group({
        nguoiLienHe: [''],
        sdtNguoiLienHe: [''],
        voChong: this.createFamilyMemberGroup(),
        bo: this.createFamilyMemberGroup(),
        me: this.createFamilyMemberGroup()
      }),

      // 2. Thông tin cho vay (Chính)
      loanInfo: this.fb.group({
        tenTaiSan: ['', Validators.required],
        loaiTaiSan: ['', Validators.required],
        ngayVay: [new Date(), Validators.required],
        maHopDong: [''],
        tongTienVay: [0, [Validators.required, Validators.min(1000)]],
        kyDongLai_So: [1, Validators.required],
        kyDongLai_DonVi: ['Thang', Validators.required],
        laiSuat_So: [0, Validators.required],
        laiSuat_DonVi: ['PhanTram', Validators.required],
        soLanTra: [1],
        kieuThuLai: ['Truoc', Validators.required],
        ghiChu: [''],
        // <-- MỚI -->
        tinhTrang: ['Binh Thuong'],
        loaiDoiTac: ['khach_hang'],
        nguonKhachHang: ['all']
      }),

      // 3. Accordion Các loại phí
      feesInfo: this.fb.group({
        phiKho: this.createFeeGroup(),
        phiLuuKho: this.createFeeGroup(),
        phiRuiRo: this.createFeeGroup(),
        phiQuanLi: this.createFeeGroup()
      }),

      // 4. Accordion Thông tin tài sản thế chấp
      collateralInfo: this.fb.group({
        dinhGia: [0],
        bienKiemSoat: [''],
        soKhung: [''],
        soMay: [''],
        kho: ['kho_1'],
        maTaiSan: [''],
        ghiChuTaiSan: ['']
      }),

      // 5. Accordion Đính kèm file
      attachments: this.fb.group({
        // (logic upload file sẽ ở đây)
      })
    });
  }

  // Helper tạo form group cho 1 thành viên gia đình
  private createFamilyMemberGroup(): FormGroup {
    return this.fb.group({ hoTen: [''], soDienThoai: [''], ngheNghiep: [''] });
  }

  // Helper tạo form group cho 1 loại phí
  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['NhapTien'], value: [0] }); // 'NhapTien' hoặc 'Nhap %'
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
    // (Lưu ý: Cần mở rộng 'PledgeContract' interface để chứa tất cả dữ liệu mới này)
    this.pledgeForm.patchValue({
      customerInfo: contract.customer,
      loanInfo: contract.loan,
      // TODO: patchValue cho customerExtraInfo, familyInfo, feesInfo, collateralInfo...
    });

    this.pledgeForm.get('loanInfo.maHopDong')?.disable();
  }

  /**
   * Xử lý lưu
   */
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.pledgeForm.getRawValue();

    // Gộp dữ liệu từ các form group
    const payload: any = { // (Nên cập nhật PledgeContract interface)
      id: this.isEditMode ? this.data?.id : undefined,
      customer: {
        ...formData.customerInfo,
        ...formData.customerExtraInfo, // Gộp thông tin
        ngaySinh: this.formatDate(formData.customerInfo.ngaySinh),
        ngayCapCCCD: this.formatDate(formData.customerInfo.ngayCapCCCD)
      },
      family: formData.familyInfo, // Gộp thông tin
      loan: {
        ...formData.loanInfo,
        ngayVay: this.formatDate(formData.loanInfo.ngayVay)!,
      },
      fees: formData.feesInfo, // Gộp thông tin
      collateral: formData.collateralInfo // Gộp thông tin
    };

    console.log('Dữ liệu gửi đi:', payload);

    // Gọi API
    const saveObservable = this.isEditMode
      ? this.pledgeService.updatePledge(this.data!.id!, payload as PledgeContract)
      : this.pledgeService.createPledge(payload as PledgeContract);

    // Giả lập
    this.notification.showSuccess(this.isEditMode ? 'Cập nhật hợp đồng thành công!' : 'Thêm mới hợp đồng thành công!');
    this.isLoading = false;
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }

  findCustomer(): void {
    this.notification.showInfo('Chức năng tìm kiếm khách hàng đang phát triển.');
  }

  addNewAssetType(): void {
    // TODO: Mở dialog "Thêm mới loại tài sản" tại đây
    this.notification.showInfo('Mở dialog Thêm mới loại tài sản (chưa làm).');
  }

  // Chụp ảnh
  takePicture(field: string): void {
    this.notification.showInfo(`Chức năng chụp ảnh cho ${field} (chưa làm).`);
  }
}
