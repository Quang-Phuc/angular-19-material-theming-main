// src/app/core/dialogs/pledge-dialog/pledge-dialog.component.ts

import { Component, OnInit, inject, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
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
import { PledgeService, PledgeContract } from '../../services/pledge.service';
import { Observable, of } from 'rxjs';

interface DropdownOption { id: string; name: string; }

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
  providers: [DatePipe]
})
export class PledgeDialogComponent implements OnInit, OnDestroy {
  pledgeForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  showAdvancedInfo = false;
  showWebcam = false; // Control webcam modal visibility
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  assetTypes$: Observable<string[]> = of(['Xe Máy', 'Ô tô', 'Điện thoại', 'Laptop', 'Vàng/Trang sức']);
  tinhTrangList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  doiTacList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' }, { id: 'nguoi_theo_doi', name: 'Người theo dõi' },
    { id: 'all', name: 'Tất cả' }, { id: 'huebntest', name: 'huebntest' }, { id: 'hue_2', name: 'Huệ 2' }
  ]);
  nguoiTheoDoiList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'user_1', name: 'User 1' }]);
  nguonKhachHangList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  khoList$: Observable<DropdownOption[]> = of([{ id: 'kho_1', name: 'Kho 1' }, { id: 'kho_2', name: 'Kho 2' }]);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);
  @Inject(MAT_DIALOG_DATA) public data: PledgeContract | null = inject(MAT_DIALOG_DATA);
  private notification = inject(NotificationService);
  private pledgeService = inject(PledgeService);
  private datePipe = inject(DatePipe);
  private stream: MediaStream | null = null; // Store webcam stream

  constructor() {
    this.isEditMode = !!this.data;

    this.pledgeForm = this.fb.group({
      portraitInfo: this.fb.group({ imageUrl: [null] }),
      customerInfo: this.fb.group({
        hoTen: ['', Validators.required],
        ngaySinh: [null],
        soCCCD: [''],
        soDienThoai: ['', Validators.required],
        diaChi: [''],
        ngayCapCCCD: [null],
        noiCapCCCD: ['']
      }),
      customerExtraInfo: this.fb.group({
        maKhachHang: [''], ngheNghiep: [''], noiLamViec: [''], hoKhau: [''], email: ['', [Validators.email]], thuNhap: [0], ghiChu: ['']
      }),
      familyInfo: this.fb.group({
        nguoiLienHe: [''], sdtNguoiLienHe: [''], voChong: this.createFamilyMemberGroup(), bo: this.createFamilyMemberGroup(), me: this.createFamilyMemberGroup()
      }),
      loanExtraInfo: this.fb.group({
        tinhTrang: ['Binh Thuong'], loaiDoiTac: ['khach_hang'], nguoiTheoDoi: ['all'], nguonKhachHang: ['all']
      }),
      loanInfo: this.fb.group({
        tenTaiSan: ['', Validators.required],
        loaiTaiSan: ['', Validators.required],
        ngayVay: [new Date(), Validators.required],
        maHopDong: [''],
        tongTienVay: [0, [Validators.required, Validators.min(1000)]],
        kyDongLai_So: [1, Validators.required],
        kyDongLai_DonVi: ['Thang', Validators.required],
        laiSuat_So: [0, Validators.required],
        laiSuat_DonVi: ['Lai/Trieu/Ngay', Validators.required],
        soLanTra: [1, Validators.required],
        kieuThuLai: ['Truoc', Validators.required],
        ghiChu: ['']
      }),
      feesInfo: this.fb.group({
        phiKho: this.createFeeGroup(),
        phiLuuKho: this.createFeeGroup(),
        phiRuiRo: this.createFeeGroup(),
        phiQuanLi: this.createFeeGroup()
      }),
      collateralInfo: this.fb.group({
        dinhGia: [0], bienKiemSoat: [''], soKhung: [''], soMay: [''], kho: ['kho_1'], maTaiSan: [''], ghiChuTaiSan: ['']
      }),
      attachments: this.fb.group({})
    });
  }

  private createFamilyMemberGroup(): FormGroup {
    return this.fb.group({ hoTen: [''], soDienThoai: [''], ngheNghiep: [''] });
  }

  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['NhapTien'], value: [0] });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data) {
      this.patchFormData(this.data);
    }
  }

  ngOnDestroy(): void {
    this.stopWebcam(); // Clean up webcam stream
  }

  patchFormData(contract: PledgeContract): void {
    this.pledgeForm.patchValue({ /* ... */ });
    this.pledgeForm.get('loanInfo.maHopDong')?.disable();
  }

  async takePicture(field: string): Promise<void> {
    if (field === 'portrait') {
      try {
        this.showWebcam = true;
        this.notification.showInfo('Đang truy cập webcam...');
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.play();
        }
      } catch (error) {
        this.notification.showError('Không thể truy cập webcam. Vui lòng kiểm tra quyền hoặc thử tải ảnh lên.');
        this.showWebcam = false;
        console.error('Webcam access error:', error);
      }
    } else if (field === 'upload') {
      this.fileInput.nativeElement.click();
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // JPEG with 80% quality
    if (imageDataUrl.length > 1024 * 1024) { // Check if image exceeds 1MB
      this.notification.showError('Ảnh quá lớn. Vui lòng thử lại với ảnh nhỏ hơn 1MB.');
      return;
    }

    this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(imageDataUrl);
    this.notification.showSuccess('Đã chụp ảnh thành công!');
    this.stopWebcam();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.match('image/jpeg|image/png|image/jpg')) {
        this.notification.showError('Vui lòng chọn file JPG, JPEG hoặc PNG.');
        return;
      }
      if (file.size > 1024 * 1024) { // 1MB limit
        this.notification.showError('File ảnh vượt quá 1MB. Vui lòng chọn file nhỏ hơn.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(result);
        this.notification.showSuccess('Đã tải ảnh lên thành công!');
      };
      reader.onerror = () => {
        this.notification.showError('Lỗi khi đọc file ảnh. Vui lòng thử lại.');
      };
      reader.readAsDataURL(file);
    }
  }

  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.showWebcam = false;
  }

  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.pledgeForm.getRawValue();

    const payload: any = {
      id: this.isEditMode ? this.data?.id : undefined,
      portrait: formData.portraitInfo,
      customer: { ...formData.customerInfo, ...formData.customerExtraInfo,
        ngaySinh: this.formatDate(formData.customerInfo.ngaySinh),
        ngayCapCCCD: this.formatDate(formData.customerInfo.ngayCapCCCD)
      },
      family: formData.familyInfo,
      loan: { ...formData.loanInfo, ...formData.loanExtraInfo,
        ngayVay: this.formatDate(formData.loanInfo.ngayVay)!
      },
      fees: formData.feesInfo,
      collateral: formData.collateralInfo
    };

    setTimeout(() => {
      this.notification.showSuccess(this.isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      this.isLoading = false;
      this.dialogRef.close(true);
    }, 800);
  }

  onCancel(): void {
    this.stopWebcam();
    this.dialogRef.close(false);
  }

  private formatDate(date: any): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
  }

  findCustomer(): void { this.notification.showInfo('Tìm kiếm khách hàng...'); }
  addNewAssetType(): void { this.notification.showInfo('Thêm loại tài sản...'); }
}
