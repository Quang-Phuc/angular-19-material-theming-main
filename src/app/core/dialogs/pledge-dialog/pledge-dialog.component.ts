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

// (Các interface DropdownOption, AssetType, ApiResponse, ... giữ nguyên)
interface DropdownOption { id: string; name: string; }
interface AssetTypeAttribute { label: string; value?: string; }
interface AssetType {
  typeCode: string;
  typeName: string;
  status: string;
  attributes: AssetTypeAttribute[];
}
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
  statusList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  partnerTypeList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' },
    { id: 'nguoi_theo_doi', name: 'Người theo dõi' }, { id: 'all', name: 'Tất cả' }
  ]);
  followerList$ = new BehaviorSubject<DropdownOption[]>([]);
  customerSourceList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  warehouseList$ = new BehaviorSubject<DropdownOption[]>([]);

  // === THAY ĐỔI: Lưu trữ File object gốc ===
  uploadedFiles: { name: string; url: string; file: File }[] = [];
  private portraitFile: File | null = null;
  // ========================================

  isDragOver = false; // <-- KHAI BÁO CỦA BẠN ĐÂY (Dòng 113)

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

    // (Định nghĩa pledgeForm không đổi)
    this.pledgeForm = this.fb.group({
      portraitInfo: this.fb.group({
        idUrl: [null]
      }),
      customerInfo: this.fb.group({
        fullName: ['', Validators.required],
        dateOfBirth: [null],
        identityNumber: ['', [Validators.minLength(9)]],
        phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^\d{10,11}$/)]],
        permanentAddress: [''],
        issueDate: [null],
        issuePlace: ['']
      }),
      customerExtraInfo: this.fb.group({
        customerCode: [''],
        occupation: [''],
        workplace: [''],
        householdRegistration: [''],
        email: ['', [Validators.email]],
        incomeVndPerMonth: [0],
        note: [''],
        contactPerson: [''],
        contactPhone: ['']
      }),
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
        loanStatus: ['Binh Thuong'],
        partnerType: ['khach_hang'],
        follower: ['all'],
        customerSource: ['all']
      }),
      loanInfo: this.fb.group({
        assetName: ['', Validators.required],
        assetType: ['', Validators.required],
        loanDate: [new Date(), Validators.required],
        contractCode: [''],
        loanAmount: [0, [Validators.required, Validators.min(1000)]],
        interestTermValue: [1, Validators.required],
        interestTermUnit: ['Thang', Validators.required],
        interestRateValue: [0, Validators.required],
        interestRateUnit: ['Lai/Trieu/Ngay', Validators.required],
        paymentCount: [1, Validators.required],
        interestPaymentType: ['Truoc', Validators.required],
        note: ['']
      }),
      feesInfo: this.fb.group({
        warehouseFee: this.createFeeGroup(),
        storageFee: this.createFeeGroup(),
        riskFee: this.createFeeGroup(),
        managementFee: this.createFeeGroup()
      }),
      collateralInfo: this.fb.group({
        valuation: [0],
        licensePlate: [''],
        chassisNumber: [''],
        engineNumber: [''],
        warehouseId: [''],
        assetCode: [''],
        assetNote: ['']
      }),
      attachments: this.fb.group({}) // Sẽ không dùng group này để gửi, mà dùng 'uploadedFiles'
    });
  }

  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['NhapTien'], value: [0] });
  }

  ngOnInit(): void {
    this.loadAssetTypes();
    this.loadFollowerList();
    this.loadWarehouseList();

    if (!this.activeStoreId) {
      this.notification.showError('Lỗi: Không xác định được cửa hàng. Vui lòng đóng và thử lại.');
      this.dialogRef.close(false);
      return;
    }

    if (this.isEditMode && this.dialogData.contract) {
      this.patchFormData(this.dialogData.contract);
    }
  }

  // (Các hàm loadWarehouseList, addNewWarehouse, loadFollowerList, loadAssetTypes giữ nguyên)
  private loadWarehouseList(): void { // loadKhoList
    if (!this.activeStoreId) {
      this.warehouseList$.next([]); // khoList$
      return;
    }

    this.apiService.get<ApiResponse<{ id: number; name: string; address: string; description?: string }[]>>(`/warehouses/store/${this.activeStoreId}`).pipe(
      map(response => response.result === 'success' && response.data ? response.data.map(w => ({ id: w.id.toString(), name: w.name })) : []),
      tap(options => this.warehouseList$.next(options)), // khoList$
      catchError(err => {
        console.error('Load warehouse list error:', err);
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
            const newWarehouse: DropdownOption = { // newKho
              id: response.data.id.toString(),
              name: result.name
            };

            const current = this.warehouseList$.value; // khoList$
            this.warehouseList$.next([...current, newWarehouse]); // khoList$
            this.pledgeForm.get('collateralInfo.warehouseId')?.setValue(newWarehouse.id);
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
  private loadFollowerList(): void { // loadNguoiTheoDoiList
    if (!this.activeStoreId) {
      console.error('No storeId available for loading users.');
      this.followerList$.next([{ id: 'all', name: 'Tất cả' }]); // nguoiTheoDoiList$
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
        this.followerList$.next(options); // nguoiTheoDoiList$
      }),
      catchError(err => {
        console.error('Load follower list error:', err);
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

  // (Các hàm ngAfterViewInit, ngOnDestroy, setupAutoSearchOnBlur, ... giữ nguyên)
  ngAfterViewInit(): void {
    this.setupAutoSearchOnBlur();
  }
  ngOnDestroy(): void {
    this.stopWebcam();
  }
  private setupAutoSearchOnBlur(): void {
    setTimeout(() => {
      const phoneInput = document.querySelector('input[formControlName="phoneNumber"]') as HTMLInputElement;
      const cccdInput = document.querySelector('input[formControlName="identityNumber"]') as HTMLInputElement;
      if (phoneInput) {
        fromEvent(phoneInput, 'blur')
          .pipe(debounceTime(300), distinctUntilChanged(), filter(() => this.isPhoneOrCccdValidForSearch()))
          .subscribe(() => this.triggerCustomerSearch());
      }
      if (cccdInput) {
        fromEvent(cccdInput, 'blur')
          .pipe(debounceTime(300), distinctUntilChanged(), filter(() => this.isPhoneOrCccdValidForSearch()))
          .subscribe(() => this.triggerCustomerSearch());
      }
    }, 100);
  }
  private isPhoneOrCccdValidForSearch(): boolean {
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const cccd = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
    return (phone.length >= 10 || cccd.length >= 9) && (phone || cccd);
  }
  private triggerCustomerSearch(): void {
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
    if (!phone && !idNumber) return;
    this.customerService.searchCustomer({ phoneNumber: phone, identityNumber: idNumber })
      .subscribe({
        next: (data: any) => { if (data && data.fullName) { this.showConfirmAndPopulate(data); } },
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
    const cInfo = this.pledgeForm.get('customerInfo');
    const cExtra = this.pledgeForm.get('customerExtraInfo');
    const family = this.pledgeForm.get('familyInfo');
    const loanExtra = this.pledgeForm.get('loanExtraInfo');
    if (cInfo) { cInfo.patchValue(data); }
    if (cExtra) { cExtra.patchValue(data); }
    if (family) { family.patchValue(data); }
    if (data.dateOfBirth) { cInfo?.get('dateOfBirth')?.setValue(new Date(data.dateOfBirth)); }
    if (data.issueDate) { cInfo?.get('issueDate')?.setValue(new Date(data.issueDate)); }
    if (data.idUrl) {
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(data.idUrl);
    }
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
  private mapLoanStatus(status: string): string {
    const map: { [key: string]: string } = { 'Chưa vay': 'Binh Thuong', 'Đang vay': 'Binh Thuong 2', 'Nợ xấu': 'No xau', 'Nợ rủi ro': 'No rui ro', 'Nợ R2': 'No R2', 'Nợ R3': 'No R3' };
    return map[status] || 'Binh Thuong';
  }
  private mapPartnerType(type: string): string {
    const map: { [key: string]: string } = { 'Cá nhân': 'khach_hang', 'Chủ nợ': 'chu_no', 'Người theo dõi': 'nguoi_theo_doi', 'Tất cả': 'all' };
    return map[type] || 'khach_hang';
  }
  private mapCustomerSource(source: string): string {
    const map: { [key: string]: string } = { 'Giới thiệu bạn bè': 'ctv', 'Tất cả': 'all' };
    return map[source] || 'all';
  }
  findCustomer(): void {
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const idNumber = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
    if (!phone && !idNumber) { this.notification.showError('Vui lòng nhập số điện thoại hoặc số CCCD để tìm kiếm.'); return; }
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
    this.pledgeForm.patchValue(contract as any);
    this.pledgeForm.get('loanInfo.contractCode')?.disable();
  }


  // (Các hàm Webcam, Attachments)
  async takePicture(field: string): Promise<void> {
    if (field === 'portrait') {
      this.showWebcam = true;
      this.notification.showInfo('Đang truy cập webcam...');
      setTimeout(async () => {
        if (!this.videoElement?.nativeElement) { this.notification.showError('Không thể truy cập phần tử video.'); this.showWebcam = false; return; }
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.play();
          this.cdr.detectChanges();
        } catch (e) { this.notification.showError('Không thể truy cập webcam.'); this.showWebcam = false; }
      }, 0);
    } else if (field === 'upload') {
      this.fileInput?.nativeElement.click();
    }
  }

  // === CẬP NHẬT: capturePhoto ===
  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (dataUrl.length > 1024 * 1024) { this.notification.showError('Ảnh quá lớn (>1MB).'); return; }
    this.pledgeForm.get('portraitInfo.idUrl')?.setValue(dataUrl);

    // === THAY ĐỔI: Xóa file gốc đã tải lên (nếu có) vì đã chụp ảnh mới ===
    this.portraitFile = null;

    this.notification.showSuccess('Chụp ảnh thành công!');
    this.stopWebcam();
  }

  // === CẬP NHẬT: onFileSelected ===
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.match('image/jpeg|image/png|image/jpg')) { this.notification.showError('Chỉ chấp nhận JPG/JPEG/PNG.'); return; }
    if (file.size > 1024 * 1024) { this.notification.showError('File ảnh ≤ 1MB.'); return; }

    // === THAY ĐỔI: Lưu File object gốc ===
    this.portraitFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(e.target?.result as string);
      this.notification.showSuccess('Tải ảnh thành công!');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  stopWebcam(): void {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    this.showWebcam = false; this.cdr.detectChanges();
  }

  // CÁC HÀM DRAG/DROP CỦA BẠN (ĐÃ CÓ isDragOver)
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
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

  // === CẬP NHẬT: handleFileUpload ===
  private handleFileUpload(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.notification.showError(`File ${file.name} > 5MB.`); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      // === THAY ĐỔI: Lưu trữ cả File object gốc ===
      this.uploadedFiles.push({ name: file.name, url: url, file: file });
      this.notification.showSuccess(`Đã tải ${file.name}`);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  // === CẬP NHẬT: removeAttachment ===
  removeAttachment(i: number): void {
    this.uploadedFiles.splice(i, 1);
    this.cdr.detectChanges();
  }

  // (addNewAssetType giữ nguyên)
  addNewAssetType(): void {
    const dialogRef = this.matDialog.open(AddAssetTypeDialogComponent, {
      width: '500px',
      data: { assetTypes: this.assetTypes$.value }
    });
    dialogRef.afterClosed().subscribe((res: AssetType | undefined) => {
      if (res) {
        const cur = this.assetTypes$.value;
        cur.push(res.typeName);
        this.assetTypes$.next(cur);
        this.notification.showSuccess('Thêm loại tài sản thành công!');
      }
    });
  }


  /* ------------------- SAVE / CANCEL ------------------- */

  // === CẬP NHẬT TOÀN BỘ HÀM onSave ===
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      this.findAndFocusFirstInvalidField();
      return;
    }

    this.isLoading = true;
    const raw = this.pledgeForm.getRawValue();

    // 1. Tái cấu trúc payload JSON (KHÔNG bao gồm file)
    const payload: any = {
      // id sẽ được xử lý riêng trong logic PUT
      storeId: this.activeStoreId,
      customer: {
        ...raw.customerInfo,
        ...raw.customerExtraInfo,
        ...raw.familyInfo,
        // idUrl (ảnh) sẽ được gửi riêng ở dạng file
        dateOfBirth: this.formatDate(raw.customerInfo.dateOfBirth),
        issueDate: this.formatDate(raw.customerInfo.issueDate)
      },
      loan: {
        ...raw.loanInfo,
        ...raw.loanExtraInfo,
        loanDate: this.formatDate(raw.loanInfo.loanDate)!
      },
      fees: raw.feesInfo,
      collateral: raw.collateralInfo,
      // attachments (file) sẽ được gửi riêng
    };

    if (!payload.storeId) {
      this.notification.showError('Lỗi nghiêm trọng: Mất storeId. Không thể lưu.');
      this.isLoading = false;
      return;
    }

    // 2. Tạo FormData
    const formData = new FormData();

    // 2a. Thêm payload JSON
    const payloadBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    formData.append("payload", payloadBlob);

    // 2b. Thêm ảnh chân dung (portrait)
    const portraitDataUrl = this.pledgeForm.get('portraitInfo.idUrl')?.value;
    if (this.portraitFile) {
      // Trường hợp 1: Người dùng tải file lên
      formData.append("portrait", this.portraitFile, this.portraitFile.name);
    } else if (portraitDataUrl) {
      // Trường hợp 2: Người dùng chụp webcam (convert dataUrl -> Blob)
      const portraitBlob = this.dataURLtoBlob(portraitDataUrl);
      if (portraitBlob) {
        formData.append("portrait", portraitBlob, "portrait.jpg");
      }
    }

    // 2c. Thêm các file đính kèm (attachments)
    for (const attachment of this.uploadedFiles) {
      formData.append("attachments", attachment.file, attachment.name);
    }

    // 3. Gửi API
    if (this.isEditMode) {
      // === LOGIC CẬP NHẬT (PUT) ===
      // TODO: Cập nhật API endpoint cho PUT (ví dụ: /api/v1/pledges/{id})
      const contractId = this.dialogData.contract?.id;
      this.notification.showError('Chức năng cập nhật (PUT) chưa được triển khai.');
      console.log('FormData cho PUT:', formData); // (Log để kiểm tra)
      this.isLoading = false;
      // Ví dụ:
      // this.apiService.put<any>(`/api/v1/pledges/${contractId}`, formData).subscribe({
      //   next: (response) => {
      //     this.isLoading = false;
      //     this.notification.showSuccess('Cập nhật thành công!');
      //     this.dialogRef.close(true);
      //   },
      //   error: (err) => {
      //     this.isLoading = false;
      //     console.error('Lỗi khi cập nhật hợp đồng:', err);
      //     this.notification.showError('Lỗi khi cập nhật hợp đồng.');
      //   }
      // });

    } else {
      // === LOGIC TẠO MỚI (POST) ===
      this.apiService.post<any>('/v1/pledges', formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notification.showSuccess('Thêm mới thành công!');
          this.dialogRef.close(true); // Gửi true để báo hiệu danh sách cần tải lại
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Lỗi khi tạo hợp đồng:', err);
          const errorMsg = err.error?.message || 'Lỗi khi tạo hợp đồng. Vui lòng thử lại.';
          this.notification.showError(errorMsg);
        }
      });
    }
  }

  // (findAndFocusFirstInvalidField giữ nguyên)
  private findAndFocusFirstInvalidField(): void {
    try {
      const invalidControlEl = this.el.nativeElement.querySelector('input.ng-invalid[formControlName], textarea.ng-invalid[formControlName], mat-select.ng-invalid[formControlName]');
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
    } catch (error) { console.error("Lỗi khi focus vào trường invalid:", error); }
  }

  onCancel(): void {
    this.stopWebcam();
    this.dialogRef.close(false);
  }

  private formatDate(date: any): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
  }

  // === THÊM HÀM HELPER: Chuyển dataURL (Base64) sang Blob ===
  private dataURLtoBlob(dataurl: string): Blob | null {
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;

      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch || mimeMatch.length < 2) return null;

      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Lỗi chuyển đổi dataURL to Blob:", e);
      return null;
    }
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
              <input matInput formControlName="typeCode" placeholder="VD: XM, ĐT">
            </mat-form-field>
          </div>
          <div class="form-grid-2-col">
            <mat-form-field appearance="outline">
              <mat-label>Tên loại tài sản (*)</mat-label>
              <input matInput formControlName="typeName" placeholder="Xe máy">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Trạng thái</mat-label>
              <mat-select formControlName="status">
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
      typeCode: ['', Validators.required], // maLoai
      typeName: ['', Validators.required], // tenLoai
      status: ['Bình thường'], // trangThai
      attributes: this.fb.array([this.fb.group({ label: [''] })])
    });
  }

  addAttribute(): void { this.attributesArray.push(this.fb.group({ label: [''] })); }
  removeAttribute(i: number): void { this.attributesArray.removeAt(i); }

  onSave(): void {
    if (this.assetTypeForm.valid) {
      const v = this.assetTypeForm.value;
      const newAsset: AssetType = {
        typeCode: v.typeCode, // maLoai
        typeName: v.typeName, // tenLoai
        status: v.status, // trangThai
        attributes: v.attributes
      };
      this.dialogRef.close(newAsset);
    }
  }

  onCancel(): void { this.dialogRef.close(); }
}
