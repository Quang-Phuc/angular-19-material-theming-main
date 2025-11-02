// src/app/core/dialogs/pledge-dialog/pledge-dialog.component.ts
import {
  Component, OnInit, inject, Inject, ViewChild, ElementRef,
  OnDestroy, ChangeDetectorRef, AfterViewInit,
  QueryList, ViewChildren
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray
} from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../services/notification.service';
import { CustomerService } from '../../services/customer.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service';
import { ApiService } from '../../services/api.service';
import { Observable, of, BehaviorSubject, fromEvent } from 'rxjs';
import { map, tap, catchError, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddWarehouseDialogComponent } from './add-warehouse-dialog.component';

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
interface UserStore {
  id: number;
  fullName: string;
  phone: string;
}

@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressBarModule, MatTabsModule, MatRadioModule,
    MatListModule,
    AddWarehouseDialogComponent
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

  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  private el: ElementRef = inject(ElementRef);

  assetTypes$ = new BehaviorSubject<string[]>([]);
  tinhTrangList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  doiTacList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' },
    { id: 'nguoi_theo_doi', name: 'Người theo dõi' }, { id: 'all', name: 'Tất cả' }
  ]);
  nguoiTheoDoiList$ = new BehaviorSubject<DropdownOption[]>([]);
  nguonKhachHangList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  khoList$ = new BehaviorSubject<DropdownOption[]>([]);

  uploadedFiles: { name: string; url: string }[] = [];
  isDragOver = false;

  private activeStoreId: string | null = null;
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);

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
    this.isEditMode = !!this.dialogData.contract;
    this.activeStoreId = this.dialogData.contract?.storeId || this.dialogData.storeId;

    // === THAY ĐỔI: SỬ DỤNG TÊN TRƯỜNG CỦA API ===
    this.pledgeForm = this.fb.group({
      portraitInfo: this.fb.group({
        idUrl: [null] // <-- Đổi tên
      }),
      customerInfo: this.fb.group({
        fullName: ['', Validators.required], // hoTen -> fullName
        dateOfBirth: [null], // ngaySinh -> dateOfBirth
        identityNumber: ['', [Validators.minLength(9)]], // soCCCD -> identityNumber
        phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^\d{10,11}$/)]], // soDienThoai -> phoneNumber
        permanentAddress: [''], // diaChi -> permanentAddress
        issueDate: [null], // ngayCapCCCD -> issueDate
        issuePlace: [''] // noiCapCCCD -> issuePlace
      }),
      customerExtraInfo: this.fb.group({
        customerCode: [''], // maKhachHang -> customerCode
        occupation: [''], // ngheNghiep -> occupation
        workplace: [''], // noiLamViec -> workplace
        householdRegistration: [''], // hoKhau -> householdRegistration
        email: ['', [Validators.email]],
        incomeVndPerMonth: [0], // thuNhap -> incomeVndPerMonth
        note: [''], // ghiChu -> note
        contactPerson: [''], // nguoiLienHe -> contactPerson
        contactPhone: [''] // sdtNguoiLienHe -> contactPhone
      }),
      // === THAY ĐỔI: GỘP PHẲNG familyInfo, BỎ 'voChong', 'bo', 'me' ===
      familyInfo: this.fb.group({
        spouseName: [''],
        spousePhone: [''],
        spouseOccupation: [''],
        fatherName: [''],
        fatherPhone: [''],
        fatherOccupation: [''],
        motherName: [''],
        motherPhone: [''],
        motherOccupation: ['']
      }),
      loanExtraInfo: this.fb.group({
        loanStatus: ['Binh Thuong'], // tinhTrang -> loanStatus
        partnerType: ['khach_hang'], // loaiDoiTac -> partnerType
        follower: ['all'], // nguoiTheoDoi -> follower
        customerSource: ['all'] // nguonKhachHang -> customerSource
      }),
      // (Các form group này giữ nguyên vì không có API mapping)
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
        valuation: [0], licensePlate: [''], chassisNumber: [''], engineNumber: [''],
        kho: [''], assetCode: [''], assetNote: ['']
      }),
      attachments: this.fb.group({})
    });
  }

  // === THAY ĐỔI: BỎ `createFamilyMemberGroup` (không cần nữa) ===

  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['NhapTien'], value: [0] });
  }

  ngOnInit(): void {
    this.loadAssetTypes();
    this.loadNguoiTheoDoiList();
    this.loadKhoList();

    if (!this.activeStoreId) {
      this.notification.showError('Lỗi: Không xác định được cửa hàng. Vui lòng đóng và thử lại.');
      this.dialogRef.close(false);
      return;
    }

    if (this.isEditMode && this.dialogData.contract) {
      this.patchFormData(this.dialogData.contract);
    }
  }

  // (Các hàm loadKhoList, addNewWarehouse, loadNguoiTheoDoiList, loadAssetTypes, ngAfterViewInit, ngOnDestroy giữ nguyên)
  private loadKhoList(): void {
    if (!this.activeStoreId) {
      this.khoList$.next([]);
      return;
    }

    this.apiService.get<ApiResponse<{ id: number; name: string; address: string; description?: string }[]>>(`/warehouses/store/${this.activeStoreId}`).pipe(
      map(response => response.result === 'success' && response.data ? response.data.map(k => ({ id: k.id.toString(), name: k.name })) : []),
      tap(options => this.khoList$.next(options)),
      catchError(err => {
        console.error('Load kho list error:', err);
        this.notification.showError('Lỗi tải danh sách kho.');
        return of([]);
      })
    ).subscribe();
  }
  addNewWarehouse(): void {
    const dialogRef = this.matDialog.open(AddWarehouseDialogComponent, {
      width: '500px',
      data: { storeId: this.activeStoreId }
    });

    dialogRef.afterClosed().subscribe((result: { name: string; address: string; description: string } | undefined) => {
      if (!result) return;

      const payload = {
        name: result.name,
        address: result.address,
        description: result.description
      };

      this.apiService.post<ApiResponse<{ id: number }>>(`/warehouses/${this.activeStoreId}`, payload).subscribe({
        next: (response) => {
          if (response.result === 'success' && response.data?.id) {
            const newKho: DropdownOption = {
              id: response.data.id.toString(),
              name: result.name
            };

            const current = this.khoList$.value;
            this.khoList$.next([...current, newKho]);

            // Tự động chọn kho vừa thêm
            this.pledgeForm.get('collateralInfo.kho')?.setValue(newKho.id);

            this.notification.showSuccess(`Đã thêm kho: ${result.name}`);
          }
        },
        error: (err) => {
          console.error('Add warehouse error:', err);
          this.notification.showError('Lỗi khi thêm kho mới.');
        }
      });
    });
  }
  private loadNguoiTheoDoiList(): void {
    if (!this.activeStoreId) {
      console.error('No storeId available for loading users.');
      this.nguoiTheoDoiList$.next([{ id: 'all', name: 'Tất cả' }]);
      return;
    }

    this.apiService.get<ApiResponse<UserStore[]>>(`/users-stores/store/${this.activeStoreId}`).pipe(
      map(response => {
        if (response.result === 'success' && response.data) {
          const allOption: DropdownOption = { id: 'all', name: 'Tất cả' };
          const userOptions: DropdownOption[] = response.data.map(user => ({
            id: user.id.toString(),
            name: `${user.fullName} - ${user.phone}`
          }));
          return [allOption, ...userOptions];
        }
        return [{ id: 'all', name: 'Tất cả' }];
      }),
      tap(options => {
        this.nguoiTheoDoiList$.next(options);
      }),
      catchError(err => {
        console.error('Load nguoi theo doi list error:', err);
        this.notification.showError('Lỗi tải danh sách người theo dõi. Sử dụng dữ liệu mặc định.');
        return of([{ id: 'all', name: 'Tất cả' }]);
      })
    ).subscribe();
  }
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
  private setupAutoSearchOnBlur(): void {
    setTimeout(() => {
      // === THAY ĐỔI: Cập nhật querySelector
      const phoneInput = document.querySelector('input[formControlName="phoneNumber"]') as HTMLInputElement;
      const cccdInput = document.querySelector('input[formControlName="identityNumber"]') as HTMLInputElement;

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
    // === THAY ĐỔI: Cập nhật get
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const cccd = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
    return (phone.length >= 10 || cccd.length >= 9) && (phone || cccd);
  }
  private triggerCustomerSearch(): void {
    // === THAY ĐỔI: Cập nhật get
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';

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

  // === THAY ĐỔI: HÀM NÀY GIỜ ĐƠN GIẢN HƠN RẤT NHIỀU ===
  private populateAllCustomerData(data: any): void {
    const cInfo = this.pledgeForm.get('customerInfo');
    const cExtra = this.pledgeForm.get('customerExtraInfo');
    const family = this.pledgeForm.get('familyInfo');
    const loanExtra = this.pledgeForm.get('loanExtraInfo');

    // 1. Patch trực tiếp, vì tên đã khớp
    if (cInfo) { cInfo.patchValue(data); }
    if (cExtra) { cExtra.patchValue(data); }
    if (family) { family.patchValue(data); }

    // 2. Xử lý các trường hợp đặc biệt (Ngày tháng)
    if (data.dateOfBirth) { cInfo?.get('dateOfBirth')?.setValue(new Date(data.dateOfBirth)); }
    if (data.issueDate) { cInfo?.get('issueDate')?.setValue(new Date(data.issueDate)); }

    // 3. Xử lý ảnh
    if (data.idUrl) {
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(data.idUrl);
    }

    // 4. Xử lý các trường cần map GIÁ TRỊ (Value)
    if (loanExtra) {
      loanExtra.patchValue({
        loanStatus: this.mapLoanStatus(data.loanStatus),
        partnerType: this.mapPartnerType(data.partnerType),
        follower: data.follower || 'all',
        customerSource: this.mapCustomerSource(data.customerSource)
      });
    }

    this.cdr.detectChanges();
  }

  // (Các hàm map... giữ nguyên vì chúng map GIÁ TRỊ, không phải KEY)
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
    // === THAY ĐỔI: Cập nhật get
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
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
    // TODO: Hàm này cũng cần được cập nhật để map từ contract -> form (nếu tên khác nhau)
    // Giả sử tên contract cũng đã được chuẩn hóa:
    this.pledgeForm.patchValue(contract as any);
    // ... hoặc bạn cần viết lại logic patch chi tiết ở đây

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
    // === THAY ĐỔI: Cập nhật set
    this.pledgeForm.get('portraitInfo.idUrl')?.setValue(dataUrl);
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
      // === THAY ĐỔI: Cập nhật set
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(e.target?.result as string);
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

  // === THAY ĐỔI: CẬP NHẬT HÀM ONSAVE ===
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      this.findAndFocusFirstInvalidField();
      return;
    }

    this.isLoading = true;
    const raw = this.pledgeForm.getRawValue();

    // Tái cấu trúc payload để gộp các form group lại
    const payload: any = {
      id: this.isEditMode ? this.dialogData.contract?.id : undefined,
      storeId: this.activeStoreId,

      // Gộp portrait, customer, extra, family vào một object 'customer'
      customer: {
        ...raw.customerInfo,
        ...raw.customerExtraInfo,
        ...raw.familyInfo,
        idUrl: raw.portraitInfo.idUrl, // Lấy idUrl từ portraitInfo

        // Chuyển đổi ngày tháng
        dateOfBirth: this.formatDate(raw.customerInfo.dateOfBirth),
        issueDate: this.formatDate(raw.customerInfo.issueDate)
      },

      // Gộp loan và extra loan
      loan: {
        ...raw.loanInfo,
        ...raw.loanExtraInfo,
        ngayVay: this.formatDate(raw.loanInfo.ngayVay)!
      },

      // Các mục còn lại giữ nguyên cấu trúc
      fees: raw.feesInfo,
      collateral: raw.collateralInfo,
      attachments: raw.attachments
    };

    // (Bỏ phần giả lập setTimeout)
    this.isLoading = false;

    // *** GHI CHÚ QUAN TRỌNG ***
    // Log này sẽ CHẠY NGAY LẬP TỨC.
    // Nếu bạn không thấy nó, 99% là do form của bạn bị INVALID
    // và hàm onSave() đã `return` ở dòng `if (this.pledgeForm.invalid)`.
    console.log('Payload to save:', payload);

    if (!payload.storeId) {
      this.notification.showError('Lỗi nghiêm trọng: Mất storeId. Không thể lưu.');
      this.isLoading = false;
      return;
    }

    // TODO: Thay thế bằng service call thật
    // const saveObservable = this.isEditMode
    //   ? this.pledgeService.updatePledge(payload.id, payload)
    //   : this.pledgeService.createPledge(payload);
    // saveObservable.subscribe(...)

    // Giả lập lưu thành công để test
    this.notification.showSuccess(this.isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
    this.dialogRef.close(true);
  }

  // === HÀM FOCUS LỖI (Giữ nguyên, vẫn hoạt động) ===
  private findAndFocusFirstInvalidField(): void {
    try {
      const invalidControlEl = this.el.nativeElement.querySelector(
        'input.ng-invalid[formControlName], ' +
        'textarea.ng-invalid[formControlName], ' +
        'mat-select.ng-invalid[formControlName]'
      );

      if (!invalidControlEl) return;

      const parentTabBody = invalidControlEl.closest('mat-tab-body');
      if (parentTabBody && this.tabGroup) {
        const tabIndex = parseInt(parentTabBody.id.split('-').pop() || '0', 10);
        if (!isNaN(tabIndex) && this.tabGroup.selectedIndex !== tabIndex) {
          this.tabGroup.selectedIndex = tabIndex;
          this.cdr.detectChanges();
        }
      }

      const parentPanelEl = invalidControlEl.closest('mat-expansion-panel');
      if (parentPanelEl && this.panels) {
        const panelComponent = this.panels.find(p => (p as any)._elementRef.nativeElement === parentPanelEl);
        if (panelComponent && !panelComponent.expanded) {
          panelComponent.open();
          this.cdr.detectChanges();
        }
      }

      setTimeout(() => {
        invalidControlEl.focus();
        invalidControlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);

    } catch (error) {
      console.error("Lỗi khi focus vào trường invalid:", error);
    }
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
