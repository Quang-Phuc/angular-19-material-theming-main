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
interface AssetTypeAttribute { label: string; value?: string; required?: boolean; }
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
  id: number;
  name: string;
  description: string;
  storeId: number;
  attributes: {
    id: number;
    label: string;
    assetTypeId: number;
  }[];
}
interface UserStore {
  id: number;
  fullName: string;
  phone: string;
}
interface AssetTypeOption {
  id: number;
  name: string;
  attributes?: AssetTypeAttribute[]; // Thêm để cache
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
  showWebcam = false;

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  private el: ElementRef = inject(ElementRef);

  assetTypes$ = new BehaviorSubject<AssetTypeOption[]>([]);
  interestRateUnits$: Observable<DropdownOption[]> = of([
    { id: 'INTEREST_PER_MILLION_PER_DAY', name: 'Lãi/Triệu/Ngày' },
    { id: 'INTEREST_PERCENT_PER_MONTH', name: 'Lãi%/Tháng' },
    { id: 'INTEREST_PER_DAY', name: 'Lãi/Ngày' }
  ]);
  loanStatuses$: Observable<DropdownOption[]> = of([
    { id: 'NORMAL', name: 'Bình Thường' },
    { id: 'NORMAL_2', name: 'Bình Thường 2' },
    { id: 'RISKY', name: 'Nợ rủi ro' },
    { id: 'BAD_DEBT_R2', name: 'Nợ R2' },
    { id: 'BAD_DEBT_R3', name: 'Nợ R3' },
    { id: 'BAD_DEBT', name: 'Nợ xấu' }
  ]);
  partnerTypeList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' },
    { id: 'nguoi_theo_doi', name: 'Người theo dõi' }, { id: 'all', name: 'Tất cả' }
  ]);
  followerList$ = new BehaviorSubject<DropdownOption[]>([]);
  customerSourceList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  warehouseList$ = new BehaviorSubject<DropdownOption[]>([]);

  uploadedFiles: { name: string; url: string; file: File }[] = [];
  private portraitFile: File | null = null;
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

  // === BIẾN ĐỘNG CHO THUỘC TÍNH TÀI SẢN ===
  assetAttributes: AssetTypeAttribute[] = [];
  get attributesFormArray(): FormArray {
    return this.pledgeForm.get('collateralInfo.attributes') as FormArray;
  }

  constructor() {
    this.isEditMode = !!this.dialogData.contract;
    this.activeStoreId = this.dialogData.contract?.storeId || this.dialogData.storeId;

    this.pledgeForm = this.fb.group({
      portraitInfo: this.fb.group({ idUrl: [null] }),
      customerInfo: this.fb.group({
        fullName: ['', Validators.required],
        dateOfBirth: [null],
        identityNumber: ['', [Validators.minLength(9)]],
        phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^\d{10,11}$/)]],
        permanentAddress: [''],
        issueDate: [null],
        issuePlace: [''],

        portraitInfo: this.fb.group({
          idUrl: [''],
          base64Data: [''],
        }),
      }),
      customerExtraInfo: this.fb.group({
        customerCode: [''], occupation: [''], workplace: [''], householdRegistration: [''],
        email: ['', [Validators.email]], incomeVndPerMonth: [0], note: [''], contactPerson: [''], contactPhone: ['']
      }),
      familyInfo: this.fb.group({
        spouseName: [''], spousePhone: [''], spouseOccupation: [''], fatherName: [''], fatherPhone: [''], fatherOccupation: [''],
        motherName: [''], motherPhone: [''], motherOccupation: ['']
      }),
      loanExtraInfo: this.fb.group({
        loanStatus: ['NORMAL'], partnerType: ['khach_hang'], follower: ['all'], customerSource: ['all']
      }),
      loanInfo: this.fb.group({
        assetName: ['', Validators.required],
        assetType: ['', Validators.required],
        loanDate: [new Date(), Validators.required],
        contractCode: [''], loanAmount: [0, [Validators.required, Validators.min(1000)]],
        interestTermValue: [1, Validators.required], interestTermUnit: ['MONTH', Validators.required],
        interestRateValue: [0, Validators.required], interestRateUnit: ['INTEREST_PER_MILLION_PER_DAY', Validators.required],
        paymentCount: [1, Validators.required], interestPaymentType: ['PERIODIC_INTEREST', Validators.required], note: ['']
      }),
      feesInfo: this.fb.group({
        warehouseFee: this.createFeeGroup(), storageFee: this.createFeeGroup(),
        riskFee: this.createFeeGroup(), managementFee: this.createFeeGroup()
      }),
      collateralInfo: this.fb.group({
        // Đưa các trường chính và bắt buộc lên đầu
        assetName: ['', Validators.required], // <-- ĐÃ SỬA: Đưa lên đầu
        assetType: [null, Validators.required], // <-- ĐÃ SỬA: Đưa lên đầu

        // Các trường còn lại
        valuation: [0],
        warehouseId: [''],
        assetCode: [''], // <-- Trường bạn yêu cầu thêm (đã có)
        assetNote: [''],
        attributes: this.fb.array([]),
      }),
      attachments: this.fb.group({})
    });
    console.log('[DEBUG-Constructor] Pledge Form đã được khởi tạo:', this.pledgeForm);
    console.log('[DEBUG-Constructor] Controls trong collateralInfo:', Object.keys(this.pledgeForm.get('collateralInfo')?.value as any));
  }

  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['AMOUNT'], value: [0] });
  }

  ngOnInit(): void {
    // 1. Tải dữ liệu động: loại tài sản, người theo dõi, kho
    this.loadAssetTypes();
    this.loadFollowerList();
    this.loadWarehouseList();

    // 2. Kiểm tra storeId bắt buộc
    if (!this.activeStoreId) {
      this.notification.showError('Lỗi: Không xác định được cửa hàng. Vui lòng đóng và thử lại.');
      this.dialogRef.close(false);
      return;
    }

    // 3. Chế độ chỉnh sửa: patch dữ liệu cũ
    if (this.isEditMode && this.dialogData.contract) {
      this.patchFormData(this.dialogData.contract);
    }

    // 4. Theo dõi thay đổi loại tài sản → hiển thị thuộc tính động (dùng cache)
    this.pledgeForm.get('loanInfo.assetType')?.valueChanges.subscribe(selectedId => {
      if (!selectedId) {
        this.clearAttributes();
        return;
      }

      const selectedType = this.assetTypes$.value.find(
        t => t.id.toString() === selectedId.toString()
      );

      if (selectedType?.attributes) {
        this.assetAttributes = selectedType.attributes.map(attr => ({
          ...attr,
        }));
        this.buildAttributeFormControls();
      } else {
        this.clearAttributes();
      }

      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.setupAutoSearchOnBlur();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  // === HÀM MỚI: LẤY TÊN LOẠI TÀI SẢN ===
  getAssetTypeName(id: string): string {
    return this.assetTypes$.value.find(t => t.id.toString() === id)?.name || 'Khác';
  }



  private buildAttributeFormControls(): void {
    this.clearAttributes();
    this.assetAttributes.forEach(attr => {
      const control = this.fb.control('', attr.required ? Validators.required : null);
      this.attributesFormArray.push(control);
    });
    this.cdr.detectChanges();
  }

  private clearAttributes(): void {
    while (this.attributesFormArray.length) {
      this.attributesFormArray.removeAt(0);
    }
    this.assetAttributes = [];
  }

  // === PATCH DỮ LIỆU KHI EDIT ===
  private patchFormData(contract: PledgeContract): void {
    this.pledgeForm.patchValue({
      customerInfo: {
        fullName: contract.customer?.fullName,
        dateOfBirth: contract.customer?.dateOfBirth,
        identityNumber: contract.customer?.identityNumber,
        phoneNumber: contract.customer?.phoneNumber,
        permanentAddress: contract.customer?.permanentAddress,
        issueDate: contract.customer?.issueDate,
        issuePlace: contract.customer?.issuePlace
      },
      customerExtraInfo: contract.customer,
      familyInfo: contract.customer,
      loanInfo: {
        assetName: contract.loan?.assetName,
        assetType: contract.loan?.assetTypeId?.toString(),
        loanDate: contract.loan?.loanDate,
        loanAmount: contract.loan?.loanAmount,
        interestTermValue: contract.loan?.interestTermValue,
        interestTermUnit: contract.loan?.interestTermUnit,
        interestRateValue: contract.loan?.interestRateValue,
        interestRateUnit: contract.loan?.interestRateUnit,
        paymentCount: contract.loan?.paymentCount,
        interestPaymentType: contract.loan?.interestPaymentType,
        note: contract.loan?.note
      },
      loanExtraInfo: contract.loan,
      feesInfo: contract.fees,
      collateralInfo: {
        valuation: contract.collateral?.valuation,
        warehouseId: contract.collateral?.warehouseId?.toString(),
        assetCode: contract.collateral?.assetCode,
        assetNote: contract.collateral?.assetNote
      }
    });

    // Patch portrait
    if (contract.customer?.idUrl) {
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(contract.customer.idUrl);
    }

    // Patch attributes nếu có
    if (contract.collateral?.attributes && contract.collateral.attributes.length > 0) {
      this.assetAttributes = contract.collateral.attributes.map(a => ({ ...a, required: false }));
      this.buildAttributeFormControls();
      contract.collateral.attributes.forEach((attr, i) => {
        this.attributesFormArray.at(i).setValue(attr.value);
      });
    }
  }

  // === LOAD DATA ===
  private loadAssetTypes(): void {
    if (!this.activeStoreId) return;

    this.apiService.get<ApiResponse<AssetTypeItem[]>>(`/asset-types/store/${this.activeStoreId}`).pipe(
      map(response => {
        if (response.result !== 'success' || !response.data) {
          return [];
        }

        // Bước 1: Lọc trùng tên (chỉ giữ loại đầu tiên, cảnh báo loại sau)
        const seenNames = new Set<string>();
        const uniqueItems = response.data.filter(item => {
          if (seenNames.has(item.name)) {
            console.warn(`[AssetType] Trùng tên loại tài sản: "${item.name}" (ID: ${item.id}) – Đã bỏ qua.`);
            return false;
          }
          seenNames.add(item.name);
          return true;
        });

        // Bước 2: Chuyển đổi thành AssetTypeOption + cache attributes
        return uniqueItems.map(item => ({
          id: item.id,
          name: item.name,
          attributes: item.attributes.map(attr => ({
            label: attr.label,
            required: false // Sẽ gán lại ở valueChanges
          }))
        } as AssetTypeOption & { attributes: AssetTypeAttribute[] }));
      }),
      tap(types => {
        // Cập nhật danh sách loại tài sản
        this.assetTypes$.next(types);

        // === CHỈ KHI EDIT: Tự động load attributes + patch giá trị cũ ===
        const currentAssetTypeId = this.pledgeForm.get('loanInfo.assetType')?.value;
        if (this.isEditMode && currentAssetTypeId && this.dialogData.contract) {
          const selectedType = types.find(t => t.id.toString() === currentAssetTypeId.toString());

          if (selectedType?.attributes) {
            // Gán danh sách thuộc tính + đánh dấu required
            this.assetAttributes = selectedType.attributes.map(attr => ({
              ...attr,
              required: ['Biển số', 'Số khung', 'Số máy', 'Hãng', 'Model', 'IMEI'].includes(attr.label)
            }));

            // Tạo form controls
            this.buildAttributeFormControls();

            // SỬA LỖI TS18048: Kiểm tra savedAttrs trước khi dùng
            const savedAttrs = this.dialogData.contract?.collateral?.attributes;
            if (savedAttrs && Array.isArray(savedAttrs) && savedAttrs.length > 0) {
              savedAttrs.forEach((attr, i) => {
                const control = this.attributesFormArray.at(i);
                if (control) {
                  control.setValue(attr.value || '');
                }
              });
            }
          } else {
            this.clearAttributes();
          }
        }
      }),
      catchError(err => {
        console.error('Load asset types error:', err);
        this.notification.showError('Lỗi tải danh sách loại tài sản.');
        return of([]);
      })
    ).subscribe();
  }

  private loadFollowerList(): void {
    if (!this.activeStoreId) {
      this.followerList$.next([{ id: 'all', name: 'Tất cả' }]);
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
      tap(options => this.followerList$.next(options)),
      catchError(err => {
        console.error('Load follower list error:', err);
        this.notification.showError('Lỗi tải danh sách người theo dõi.');
        return of([{ id: 'all', name: 'Tất cả' }]);
      })
    ).subscribe();
  }

  private loadWarehouseList(): void {
    if (!this.activeStoreId) {
      this.warehouseList$.next([]);
      return;
    }

    this.apiService.get<ApiResponse<{ id: number; name: string; address: string; description?: string }[]>>(`/warehouses/store/${this.activeStoreId}`).pipe(
      map(response => response.result === 'success' && response.data ? response.data.map(w => ({ id: w.id.toString(), name: w.name })) : []),
      tap(options => this.warehouseList$.next(options)),
      catchError(err => {
        console.error('Load warehouse list error:', err);
        this.notification.showError('Lỗi tải danh sách kho.');
        return of([]);
      })
    ).subscribe();
  }

  // === WEBCAM & UPLOAD ===
  async takePicture(field: 'portrait' | 'upload'): Promise<void> {
    if (field === 'portrait') {
      this.showWebcam = true;
      if (!this.videoElement?.nativeElement) {
        this.notification.showError('Không thể truy cập phần tử video.');
        this.showWebcam = false;
        return;
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
      this.notification.showError('Ảnh quá lớn (>1MB).');
      return;
    }
    this.pledgeForm.get('portraitInfo.idUrl')?.setValue(dataUrl);
    this.portraitFile = null;
    this.notification.showSuccess('Chụp ảnh thành công!');
    this.stopWebcam();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.match('image/jpeg|image/png|image/jpg')) {
      this.notification.showError('Chỉ chấp nhận JPG/JPEG/PNG.');
      return;
    }
    if (file.size > 1024 * 1024) {
      this.notification.showError('File ảnh ≤ 1MB.');
      return;
    }
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
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.showWebcam = false;
    this.cdr.detectChanges();
  }

  // === DRAG & DROP ===
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

  private handleFileUpload(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.notification.showError(`File ${file.name} > 5MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      this.uploadedFiles.push({ name: file.name, url: url, file: file });
      this.notification.showSuccess(`Đã tải ${file.name}`);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeAttachment(i: number): void {
    this.uploadedFiles.splice(i, 1);
    this.cdr.detectChanges();
  }

  // === ADD NEW ===
  // === ADD NEW ASSET TYPE ===
  addNewAssetType(): void {
    const dialogRef = this.matDialog.open(AddAssetTypeDialogComponent, {
      width: '500px',
      data: { assetTypes: this.assetTypes$.value.map(t => t.name) }
    });

    dialogRef.afterClosed().subscribe((res: AssetType | undefined) => {
      if (!res) return;

      // === ĐẢM BẢO GỬI ĐẦY ĐỦ: typeCode, typeName, status, attributes ===
      const payload = {
        typeCode: res.typeCode,
        typeName: res.typeName,
        status: res.status,
        attributes: res.attributes.filter(attr => attr.label.trim() !== '') // Lọc bỏ rỗng
      };

      this.apiService.post<ApiResponse<{ id: number }>>('/asset-types', payload).subscribe({
        next: (resp) => {
          if (resp.result === 'success' && resp.data?.id) {
            const newType: AssetTypeOption = { id: resp.data.id, name: res.typeName };
            this.assetTypes$.next([...this.assetTypes$.value, newType]);

            // Tự động chọn loại tài sản vừa thêm
            this.pledgeForm.get('loanInfo.assetType')?.setValue(newType.id.toString());

            // Tải lại thuộc tính động cho loại tài sản mới
            // this.loadAssetAttributes(newType.id.toString());

            this.notification.showSuccess(`Thêm loại tài sản "${res.typeName}" thành công!`);
          } else {
            this.notification.showError('Thêm loại tài sản thất bại. Vui lòng thử lại.');
          }
        },
        error: (err) => {
          console.error('Add asset type error:', err);
          this.notification.showError('Lỗi kết nối server khi thêm loại tài sản.');
        }
      });
    });
  }

  addNewWarehouse(): void {
    const dialogRef = this.matDialog.open(AddWarehouseDialogComponent, {
      width: '500px',
      data: { storeId: this.activeStoreId }
    });

    dialogRef.afterClosed().subscribe((result: { name: string; address: string; description: string } | undefined) => {
      if (!result) return;

      const payload = { name: result.name, address: result.address, description: result.description };

      this.apiService.post<ApiResponse<{ id: number }>>(`/warehouses/${this.activeStoreId}`, payload).subscribe({
        next: (response) => {
          if (response.result === 'success' && response.data?.id) {
            const newWarehouse: DropdownOption = { id: response.data.id.toString(), name: result.name };
            const current = this.warehouseList$.value;
            this.warehouseList$.next([...current, newWarehouse]);
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

  // === AUTO SEARCH ===
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
    const message = `Tìm thấy khách hàng: <strong>${name}</strong> ${phone}.<br><small>Đã có dữ liệu: thông tin cá nhân, gia đình, thu nhập, nguồn...</small><br><strong>Bạn có muốn sử dụng dữ liệu đã lưu không?</strong>`;
    this.notification.showConfirm(message, 'Có', 'Không', 15000)
      .then(confirmed => {
        if (confirmed) {
          this.populateAllCustomerData(customerData);
          this.notification.showSuccess('Đã điền thông tin khách hàng!');
        }
      });
  }

  private populateAllCustomerData(data: any): void {
    this.pledgeForm.patchValue({
      customerInfo: data,
      customerExtraInfo: data,
      familyInfo: data
    });
  }

  // === SAVE ===
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      this.pledgeForm.markAllAsTouched();
      this.findAndFocusFirstInvalidField();
      return;
    }

    this.isLoading = true;
    const raw = this.pledgeForm.getRawValue();

    const payload: any = {
      storeId: this.activeStoreId,
      customer: {
        ...raw.customerInfo,
        ...raw.customerExtraInfo,
        ...raw.familyInfo,
        dateOfBirth: this.formatDate(raw.customerInfo.dateOfBirth),
        issueDate: this.formatDate(raw.customerInfo.issueDate)
      },
      loan: {
        ...raw.loanInfo,
        ...raw.loanExtraInfo,
        assetTypeId: raw.loanInfo.assetType,
        loanDate: this.formatDate(raw.loanInfo.loanDate)!
      },
      fees: raw.feesInfo,
      collateral: {
        ...raw.collateralInfo,
        attributes: this.assetAttributes.map((attr, i) => ({
          label: attr.label,
          value: raw.collateralInfo.attributes[i] || ''
        }))
      }
    };

    if (!payload.storeId) {
      this.notification.showError('Lỗi nghiêm trọng: Mất storeId.');
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));

    if (this.portraitFile) {
      formData.append("portrait", this.portraitFile, this.portraitFile.name);
    } else if (this.pledgeForm.get('portraitInfo.idUrl')?.value) {
      const blob = this.dataURLtoBlob(this.pledgeForm.get('portraitInfo.idUrl')?.value);
      if (blob) formData.append("portrait", blob, "portrait.jpg");
    }

    this.uploadedFiles.forEach(f => formData.append("attachments", f.file, f.name));

    if (this.isEditMode) {
      this.notification.showError('Chức năng cập nhật (PUT) chưa được triển khai.');
      this.isLoading = false;
    } else {
      this.apiService.post<any>('/v1/pledges', formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.notification.showSuccess('Thêm mới thành công!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Lỗi khi tạo hợp đồng:', err);
          this.notification.showError(err.error?.message || 'Lỗi khi tạo hợp đồng.');
        }
      });
    }
  }

  onCancel(): void {
    this.stopWebcam();
    this.dialogRef.close(false);
  }

  private formatDate(date: any): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
  }

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
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Lỗi chuyển đổi dataURL to Blob:", e);
      return null;
    }
  }

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
    } catch (error) {
      console.error("Lỗi khi focus vào trường invalid:", error);
    }
  }
}

// === ADD ASSET TYPE DIALOG (GIỮ NGUYÊN) ===
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
      typeCode: ['', Validators.required],
      typeName: ['', Validators.required],
      status: ['Bình thường'],
      attributes: this.fb.array([this.fb.group({ label: [''] })])
    });
  }

  addAttribute(): void { this.attributesArray.push(this.fb.group({ label: [''] })); }
  removeAttribute(i: number): void { this.attributesArray.removeAt(i); }

  onSave(): void {
    if (this.assetTypeForm.valid) {
      const v = this.assetTypeForm.value;
      const newAsset: AssetType = {
        typeCode: v.typeCode,
        typeName: v.typeName,
        status: v.status,
        attributes: v.attributes.filter((a: any) => a.label && a.label.trim() !== '')
      };
      this.dialogRef.close(newAsset);
    }
  }

  onCancel(): void { this.dialogRef.close(); }
}
