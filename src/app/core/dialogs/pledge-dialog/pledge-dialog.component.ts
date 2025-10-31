// pledge-dialog.component.ts (ĐÃ CẬP NHẬT)
import {
  Component, OnInit, inject, Inject, ViewChild, ElementRef,
  OnDestroy, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray
} from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog
} from '@angular/material/dialog';
// (Các import khác giữ nguyên)
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
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../services/notification.service';
import { CustomerService } from '../../services/customer.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service';
import { ApiService } from '../../services/api.service';
import { Observable, of, BehaviorSubject, fromEvent } from 'rxjs';
import { map, tap, catchError, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// (Các interface DropdownOption, AssetTypeAttribute, ... giữ nguyên)
interface DropdownOption { id: string; name: string; }
interface AssetTypeAttribute { label: string; value?: string; }
interface AssetType { maLoai: string; tenLoai: string; trangThai: string; attributes: AssetTypeAttribute[]; }
interface ApiResponse<T> {
  timeStamp: string; securityVersion: string; result: string;
  message: string; errorCode: string; data?: T;
}
interface AssetTypeItem {
  id: number; name: string; description: string; idUrl?: string; createdBy?: string;
  createdDate?: string; lastUpdatedBy?: string; lastUpdatedDate?: string;
}


@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressBarModule, MatTabsModule, MatRadioModule,
    MatListModule
  ],
  templateUrl: './pledge-dialog.component.html',
  styleUrl: './pledge-dialog.component.scss',
  providers: [DatePipe]
})
export class PledgeDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  pledgeForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  showAdvancedInfo = false;
  showWebcam = false;

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  assetTypes$ = new BehaviorSubject<string[]>([]);
  // (Các Observable $ khác giữ nguyên)
  tinhTrangList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  doiTacList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' },
    { id: 'nguoi_theo_doi', name: 'Người theo dõi' }, { id: 'all', name: 'Tất cả' },
    { id: 'huebntest', name: 'huebntest' }, { id: 'hue_2', name: 'Huệ 2' }
  ]);
  nguoiTheoDoiList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'user_1', name: 'User 1' }]);
  nguonKhachHangList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  khoList$: Observable<DropdownOption[]> = of([{ id: 'kho_1', name: 'Kho 1' }, { id: 'kho_2', name: 'Kho 2' }]);

  uploadedFiles: { name: string; url: string }[] = [];
  isDragOver = false;

  // *** THÊM MỚI 1: Biến lưu storeId ***
  private activeStoreId: string | null = null;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);

  // *** THAY ĐỔI 2: Cập nhật cách inject data ***
  @Inject(MAT_DIALOG_DATA) public dialogData: { contract: PledgeContract | null, storeId: string | null } = inject(MAT_DIALOG_DATA);

  private notification = inject(NotificationService);
  private customerService = inject(CustomerService);
  private pledgeService = inject(PledgeService);
  private apiService = inject(ApiService);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private stream: MediaStream | null = null;

  constructor() {
    // *** THAY ĐỔI 3: Cập nhật logic constructor ***
    this.isEditMode = !!this.dialogData.contract;

    // Nếu là Sửa (edit), lấy storeId từ contract.
    // Nếu là Thêm (add), lấy storeId được truyền vào từ list.
    this.activeStoreId = this.dialogData.contract?.storeId || this.dialogData.storeId;

    // (Phần khởi tạo pledgeForm giữ nguyên)
    this.pledgeForm = this.fb.group({
      portraitInfo: this.fb.group({ imageUrl: [null] }),
      customerInfo: this.fb.group({
        hoTen: ['', Validators.required],
        ngaySinh: [null],
        soCCCD: ['', [Validators.minLength(9)]],
        soDienThoai: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^\d{10,11}$/)]],
        diaChi: [''],
        ngayCapCCCD: [null],
        noiCapCCCD: ['']
      }),
      customerExtraInfo: this.fb.group({
        maKhachHang: [''], ngheNghiep: [''], noiLamViec: [''], hoKhau: [''],
        email: ['', [Validators.email]], thuNhap: [0], ghiChu: [''],
        nguoiLienHe: [''], sdtNguoiLienHe: ['']
      }),
      familyInfo: this.fb.group({
        voChong: this.createFamilyMemberGroup(),
        bo: this.createFamilyMemberGroup(),
        me: this.createFamilyMemberGroup()
      }),
      loanExtraInfo: this.fb.group({
        tinhTrang: ['Binh Thuong'], loaiDoiTac: ['khach_hang'],
        nguoiTheoDoi: ['all'], nguonKhachHang: ['all']
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
        dinhGia: [0], bienKiemSoat: [''], soKhung: [''], soMay: [''],
        kho: ['kho_1'], maTaiSan: [''], ghiChuTaiSan: ['']
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
    this.loadAssetTypes();

    // *** THAY ĐỔI 4: Kiểm tra storeId và patch data ***
    if (!this.activeStoreId) {
      this.notification.showError('Lỗi: Không xác định được cửa hàng. Vui lòng đóng và thử lại.');
      this.dialogRef.close(false);
      return;
    }

    if (this.isEditMode && this.dialogData.contract) {
      this.patchFormData(this.dialogData.contract);
    }
  }

  // (Các hàm loadAssetTypes, ngAfterViewInit, ngOnDestroy, ... giữ nguyên)
  private loadAssetTypes(): void {
    this.apiService.get<ApiResponse<AssetTypeItem[]>>('/asset-types').pipe(
      map(response => {
        if (response.result === 'success' && response.data) {
          return response.data.map(item => item.name);
        }
        return [];
      }),
      tap(types => {
        this.assetTypes$.next(types);
      }),
      catchError(err => {
        console.error('Load asset types error:', err);
        this.notification.showError('Lỗi tải loại tài sản. Sử dụng dữ liệu mặc định.');
        return of([]);
      })
    ).subscribe();
  }

  ngAfterViewInit(): void {
    this.setupAutoSearchOnBlur();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  // (Các hàm setupAutoSearchOnBlur, isPhoneOrCccdValidForSearch, triggerCustomerSearch, ... giữ nguyên)
  private setupAutoSearchOnBlur(): void {
    setTimeout(() => {
      const phoneInput = document.querySelector('input[formControlName="soDienThoai"]') as HTMLInputElement;
      const cccdInput = document.querySelector('input[formControlName="soCCCD"]') as HTMLInputElement;

      if (phoneInput) {
        fromEvent(phoneInput, 'blur')
          .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(() => this.isPhoneOrCccdValidForSearch())
          )
          .subscribe(() => this.triggerCustomerSearch());
      }

      if (cccdInput) {
        fromEvent(cccdInput, 'blur')
          .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter(() => this.isPhoneOrCccdValidForSearch())
          )
          .subscribe(() => this.triggerCustomerSearch());
      }
    }, 100);
  }
  private isPhoneOrCccdValidForSearch(): boolean {
    const phone = this.pledgeForm.get('customerInfo.soDienThoai')?.value?.trim() || '';
    const cccd = this.pledgeForm.get('customerInfo.soCCCD')?.value?.trim() || '';
    return (phone.length >= 10 || cccd.length >= 9) && (phone || cccd);
  }
  private triggerCustomerSearch(): void {
    const phone = this.pledgeForm.get('customerInfo.soDienThoai')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.soCCCD')?.value?.trim() || '';

    if (!phone && !idNumber) return;

    this.customerService.searchCustomer({ phoneNumber: phone, identityNumber: idNumber })
      .subscribe({
        next: (data: any) => {
          if (data && data.fullName) {
            this.showConfirmAndPopulate(data);
          }
        },
        error: (err) => console.error('Auto search error:', err)
      });
  }
  private showConfirmAndPopulate(customerData: any): void {
    const name = customerData.fullName || 'Khách hàng';
    const phone = customerData.phoneNumber ? `(${customerData.phoneNumber})` : '';
    const message = `
      Tìm thấy khách hàng: <strong>${name}</strong> ${phone}.<br>
      <small>Đã có dữ liệu: thông tin cá nhân, gia đình, thu nhập, nguồn...</small><br>
      <strong>Bạn có muốn sử dụng dữ liệu đã lưu không?</strong>
    `;

    this.notification.showConfirm(message, 'Có', 'Không', 15000)
      .then(confirmed => {
        if (confirmed) {
          this.populateAllCustomerData(customerData);
          this.notification.showSuccess('Đã điền toàn bộ thông tin khách hàng!');
        }
      });
  }
  private populateAllCustomerData(data: any): void {
    // (Logic populate giữ nguyên)
    const cInfo = this.pledgeForm.get('customerInfo');
    const cExtra = this.pledgeForm.get('customerExtraInfo');
    const family = this.pledgeForm.get('familyInfo');
    const loanExtra = this.pledgeForm.get('loanExtraInfo');

    if (cInfo) {
      cInfo.patchValue({
        hoTen: data.fullName || '',
        soDienThoai: data.phoneNumber || '',
        ngaySinh: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        soCCCD: data.identityNumber || '',
        ngayCapCCCD: data.issueDate ? new Date(data.issueDate) : null,
        noiCapCCCD: data.issuePlace || '',
        diaChi: data.permanentAddress || ''
      });
    }
    if (cExtra) {
      cExtra.patchValue({
        maKhachHang: data.customerCode || '',
        ngheNghiep: data.occupation || '',
        noiLamViec: data.workplace || '',
        hoKhau: data.householdRegistration || '',
        email: data.email || '',
        thuNhap: data.incomeVndPerMonth || 0,
        ghiChu: data.note || '',
        nguoiLienHe: data.contactPerson || '',
        sdtNguoiLienHe: data.contactPhone || ''
      });
    }
    if (family) {
      family.patchValue({
        voChong: {
          hoTen: data.spouseName || '', soDienThoai: data.spousePhone || '',
          ngheNghiep: data.spouseOccupation || ''
        },
        bo: {
          hoTen: data.fatherName || '', soDienThoai: data.fatherPhone || '',
          ngheNghiep: data.fatherOccupation || ''
        },
        me: {
          hoTen: data.motherName || '', soDienThoai: data.motherPhone || '',
          ngheNghiep: data.motherOccupation || ''
        }
      });
    }
    if (loanExtra) {
      loanExtra.patchValue({
        tinhTrang: this.mapLoanStatus(data.loanStatus),
        loaiDoiTac: this.mapPartnerType(data.partnerType),
        nguoiTheoDoi: data.follower || 'all',
        nguonKhachHang: this.mapCustomerSource(data.customerSource)
      });
    }
    if (data.idUrl) {
      this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(data.idUrl);
    }

    this.cdr.detectChanges();
  }
  private mapLoanStatus(status: string): string {
    const map: { [key: string]: string } = {
      'Chưa vay': 'Binh Thuong', 'Đang vay': 'Binh Thuong 2', 'Nợ xấu': 'No xau',
      'Nợ rủi ro': 'No rui ro', 'Nợ R2': 'No R2', 'Nợ R3': 'No R3'
    };
    return map[status] || 'Binh Thuong';
  }
  private mapPartnerType(type: string): string {
    const map: { [key: string]: string } = {
      'Cá nhân': 'khach_hang', 'Chủ nợ': 'chu_no',
      'Người theo dõi': 'nguoi_theo_doi', 'Tất cả': 'all'
    };
    return map[type] || 'khach_hang';
  }
  private mapCustomerSource(source: string): string {
    const map: { [key: string]: string } = {
      'Giới thiệu bạn bè': 'ctv', 'Tất cả': 'all'
    };
    return map[source] || 'all';
  }
  findCustomer(): void {
    const phone = this.pledgeForm.get('customerInfo.soDienThoai')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.soCCCD')?.value?.trim() || '';
    if (!phone && !idNumber) {
      this.notification.showError('Vui lòng nhập số điện thoại hoặc số CCCD để tìm kiếm.');
      return;
    }
    this.customerService.searchCustomer({ phoneNumber: phone, identityNumber: idNumber })
      .subscribe({
        next: (data: any) => {
          if (data && data.fullName) { this.showConfirmAndPopulate(data); }
          else { this.notification.showError('Không tìm thấy khách hàng.'); }
        },
        error: () => this.notification.showError('Lỗi khi tìm kiếm khách hàng.')
      });
  }
  patchFormData(contract: PledgeContract): void {
    // (Logic patchFormData giữ nguyên, không cần patch storeId vào form)
    this.pledgeForm.patchValue({ /* ... */ });
    this.pledgeForm.get('loanInfo.maHopDong')?.disable();
  }

  // (Các hàm Webcam, Attachments, Asset Type giữ nguyên)
  async takePicture(field: string): Promise<void> {
    if (field === 'portrait') {
      this.showWebcam = true;
      this.notification.showInfo('Đang truy cập webcam...');
      setTimeout(async () => {
        if (!this.videoElement?.nativeElement) {
          this.notification.showError('Không thể truy cập phần tử video.');
          this.showWebcam = false; return;
        }
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.play();
          this.cdr.detectChanges();
        } catch (e) {
          this.notification.showError('Không thể truy cập webcam.');
          this.showWebcam = false;
        }
      }, 0);
    } else if (field === 'upload') {
      this.fileInput?.nativeElement.click();
    }
  }
  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (dataUrl.length > 1024 * 1024) {
      this.notification.showError('Ảnh quá lớn (>1MB).'); return;
    }
    this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(dataUrl);
    this.notification.showSuccess('Chụp ảnh thành công!');
    this.stopWebcam();
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.match('image/jpeg|image/png|image/jpg')) {
      this.notification.showError('Chỉ chấp nhận JPG/JPEG/PNG.'); return;
    }
    if (file.size > 1024 * 1024) {
      this.notification.showError('File ảnh ≤ 1MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(e.target?.result as string);
      this.notification.showSuccess('Tải ảnh thành công!');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }
  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.showWebcam = false; this.cdr.detectChanges();
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragOver = false;
    const files = e.dataTransfer?.files;
    if (files) Array.from(files).forEach(f => this.handleFileUpload(f));
  }
  onAttachmentClick(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.onchange = (ev: any) => {
      Array.from(ev.target.files as FileList).forEach(f => this.handleFileUpload(f));
    };
    input.click();
  }
  private handleFileUpload(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.notification.showError(`File ${file.name} > 5MB.`); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      this.uploadedFiles.push({ name: file.name, url });
      this.pledgeForm.get('attachments')?.patchValue(this.uploadedFiles);
      this.notification.showSuccess(`Đã tải ${file.name}`);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }
  removeAttachment(i: number): void {
    this.uploadedFiles.splice(i, 1);
    this.pledgeForm.get('attachments')?.patchValue(this.uploadedFiles);
    this.cdr.detectChanges();
  }
  addNewAssetType(): void {
    const dialogRef = this.matDialog.open(AddAssetTypeDialogComponent, {
      width: '500px',
      data: { assetTypes: this.assetTypes$.value }
    });
    dialogRef.afterClosed().subscribe((res: AssetType | undefined) => {
      if (res) {
        const cur = this.assetTypes$.value;
        cur.push(res.tenLoai);
        this.assetTypes$.next(cur);
        this.notification.showSuccess('Thêm loại tài sản thành công!');
      }
    });
  }


  /* ------------------- SAVE / CANCEL ------------------- */
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const raw = this.pledgeForm.getRawValue();

    // *** THAY ĐỔI 5: Thêm storeId vào payload ***
    const payload: any = {
      id: this.isEditMode ? this.dialogData.contract?.id : undefined,
      storeId: this.activeStoreId, // <-- THÊM STOREID VÀO ĐÂY
      portrait: raw.portraitInfo,
      customer: {
        ...raw.customerInfo,
        ...raw.customerExtraInfo,
        ngaySinh: this.formatDate(raw.customerInfo.ngaySinh),
        ngayCapCCCD: this.formatDate(raw.customerInfo.ngayCapCCCD)
      },
      family: raw.familyInfo,
      loan: {
        ...raw.loanInfo,
        ...raw.loanExtraInfo,
        ngayVay: this.formatDate(raw.loanInfo.ngayVay)!
      },
      fees: raw.feesInfo,
      collateral: raw.collateralInfo,
      attachments: raw.attachments
    };

    // (Giả lập lưu)
    // TODO: Thay thế bằng service call thật
    // const saveObservable = this.isEditMode
    //   ? this.pledgeService.updatePledge(payload.id, payload)
    //   : this.pledgeService.createPledge(payload);
    // saveObservable.subscribe(...)

    setTimeout(() => {
      console.log('Payload to save:', payload); // Log để kiểm tra
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
}

// (Component AddAssetTypeDialogComponent giữ nguyên)
@Component({
  selector: 'app-add-asset-type-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatExpansionModule, MatListModule
  ],
  template: `
    <mat-dialog-content>
      <h2 mat-dialog-title>Thêm mới loại tài sản</h2>
      <form [formGroup]="assetTypeForm">
        <div class="info-section">
          <h3>Thông tin chung</h3>
          <div class="form-grid-2-col">
            <mat-form-field appearance="outline">
              <mat-label>Lĩnh vực</mat-label>
              <input matInput value="Cầm đồ + Nhận vay" disabled>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Mã loại tài sản (*)</mat-label>
              <input matInput formControlName="maLoai" placeholder="VD: XM, ĐT">
            </mat-form-field>
          </div>
          <div class="form-grid-2-col">
            <mat-form-field appearance="outline">
              <mat-label>Tên loại tài sản (*)</mat-label>
              <input matInput formControlName="tenLoai" placeholder="Xe máy">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Trạng thái</mat-label>
              <mat-select formControlName="trangThai">
                <mat-option value="Bình thường">Bình thường</mat-option>
                <mat-option value="Không hoạt động">Không hoạt động</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="info-section">
          <h3>Cấu hình thuộc tính hàng hóa</h3>
          <div formArrayName="attributes">
            <div *ngFor="let ctrl of attributesArray.controls; let i=index" [formGroupName]="i" class="attribute-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Thuộc tính {{i+1}} (VD: Biển số xe)</mat-label>
                <input matInput formControlName="label" placeholder="VD: Biển số xe">
                <button mat-icon-button matSuffix (click)="removeAttribute(i)" type="button">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-form-field>
            </div>
          </div>
          <button mat-stroked-button type="button" (click)="addAttribute()" class="add-attribute-btn">
            <mat-icon>add</mat-icon> Thêm thuộc tính
          </button>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Đóng</button>
      <button mat-flat-button color="primary" [disabled]="assetTypeForm.invalid" (click)="onSave()">Thêm mới</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .info-section { margin-bottom: 24px; }
    .info-section h3 { font-weight: 600; color: #004d40; margin-bottom: 16px; }
    .attribute-row { margin-bottom: 16px; }
    .add-attribute-btn { margin-top: 8px; }
    .form-grid-2-col { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
    .full-width { width: 100%; }
  `]
})
export class AddAssetTypeDialogComponent {
  assetTypeForm: FormGroup;
  get attributesArray() { return this.assetTypeForm.get('attributes') as FormArray; }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddAssetTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assetTypes: string[] }
  ) {
    this.assetTypeForm = this.fb.group({
      maLoai: ['', Validators.required],
      tenLoai: ['', Validators.required],
      trangThai: ['Bình thường'],
      attributes: this.fb.array([this.fb.group({ label: [''] })])
    });
  }

  addAttribute(): void { this.attributesArray.push(this.fb.group({ label: [''] })); }
  removeAttribute(i: number): void { this.attributesArray.removeAt(i); }

  onSave(): void {
    if (this.assetTypeForm.valid) {
      const v = this.assetTypeForm.value;
      const newAsset: AssetType = {
        maLoai: v.maLoai,
        tenLoai: v.tenLoai,
        trangThai: v.trangThai,
        attributes: v.attributes
      };
      this.dialogRef.close(newAsset);
    }
  }

  onCancel(): void { this.dialogRef.close(); }
}
