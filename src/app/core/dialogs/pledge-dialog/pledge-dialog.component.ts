// src/app/core/dialogs/pledge-dialog/pledge-dialog.component.ts
import {
  Component, OnInit, inject, Inject, ViewChild, ElementRef,
  OnDestroy, ChangeDetectorRef, AfterViewInit,
  QueryList, ViewChildren, TemplateRef
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
import {MatTabGroup, MatTabsModule} from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../services/notification.service';
import { CustomerService } from '../../services/customer.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service';
import { ApiService } from '../../services/api.service';
import { Observable, of, BehaviorSubject, fromEvent } from 'rxjs';
import { map, tap, catchError, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddWarehouseDialogComponent } from './add-warehouse-dialog.component';
import { MatTableModule } from '@angular/material/table';

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
  attributes?: AssetTypeAttribute[];
}

@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressBarModule, MatTabsModule, MatRadioModule,
    MatListModule, MatTableModule, AddWarehouseDialogComponent
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
  displayedColumns: string[] = ['assetName', 'assetType', 'assetCode', 'valuation', 'view', 'actions'];
  collateralList: any[] = [];
  selectedCollateralIndex: number | null = null;  // Để edit item
  private lastSelectedAssetType: string | null = null;

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('collateralDetailDialog') collateralDetailDialog!: TemplateRef<any>;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
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

  assetAttributes: AssetTypeAttribute[] = [];
  get attributesFormArray(): FormArray {
    return this.pledgeForm.get('collateralInfo.attributes') as FormArray;
  }

  getWarehouseName(id: string): string {
    return this.warehouseList$.value.find(w => w.id === id)?.name || 'Không xác định';
  }

  getAssetTypeName(id: string): string {
    if (!id) return 'Không xác định';
    return this.assetTypes$.value.find(t => t.id.toString() === id.toString())?.name || 'Khác';
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
        assetName: ['', Validators.required],
        assetType: [null, Validators.required],
        valuation: [0],
        warehouseId: [''],
        assetCode: [''],
        assetNote: [''],
        attributes: this.fb.array([]),
      }),
      attachments: this.fb.group({})
    });
  }

  private createFeeGroup(): FormGroup {
    return this.fb.group({ type: ['AMOUNT'], value: [0] });
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

    this.pledgeForm.get('collateralInfo.assetType')?.valueChanges.subscribe(selectedId => {
      if (!selectedId) {
        this.clearAttributes();
        return;
      }

      const selectedType = this.assetTypes$.value.find(t => t.id.toString() === selectedId.toString());
      if (selectedType?.attributes) {
        this.assetAttributes = selectedType.attributes.map(attr => ({ ...attr }));
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

  private buildAttributeFormControls(): void {
    const attributesArray = this.fb.array([]);
    this.assetAttributes.forEach(attr => {
      const control = this.fb.control('', attr.required ? Validators.required : null);
      attributesArray.push(control);
    });
    (this.pledgeForm.get('collateralInfo') as FormGroup).setControl('attributes', attributesArray);
    this.cdr.detectChanges();
  }

  private clearAttributes(): void {
    while (this.attributesFormArray.length) {
      this.attributesFormArray.removeAt(0);
    }
    this.assetAttributes = [];
  }

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
      feesInfo: contract.fees
    });

    // Patch portrait
    if (contract.customer?.idUrl) {
      this.pledgeForm.get('portraitInfo.idUrl')?.setValue(contract.customer.idUrl);
    }

    // Patch collateral list (mảng)
    if (contract.collateral && contract.collateral.length > 0) {
      this.collateralList = contract.collateral.map(c => ({
        assetName: c.assetName,
        assetType: c.assetType,
        valuation: c.valuation,
        warehouseId: c.warehouseId,
        assetCode: c.assetCode,
        assetNote: c.assetNote,
        attributes: c.attributes ? c.attributes.map(a => ({ ...a })) : []
      }));
    }
  }

  private loadAssetTypes(): void {
    if (!this.activeStoreId) return;

    this.apiService.get<ApiResponse<AssetTypeItem[]>>(`/asset-types/store/${this.activeStoreId}`).pipe(
      map(response => {
        if (response.result !== 'success' || !response.data) return [];

        const seenNames = new Set<string>();
        const uniqueItems = response.data.filter(item => {
          if (seenNames.has(item.name)) return false;
          seenNames.add(item.name);
          return true;
        });

        return uniqueItems.map(item => ({
          id: item.id,
          name: item.name,
          attributes: item.attributes.map(attr => ({
            label: attr.label,
            required: false
          }))
        }));
      }),
      tap(types => {
        this.assetTypes$.next(types);
        if (this.isEditMode && this.dialogData.contract) {
          // Attributes sẽ được load khi edit item cụ thể
        }
      })
    ).subscribe();
  }

  private loadFollowerList(): void {
    // Giữ nguyên code load follower
  }

  private loadWarehouseList(): void {
    // Giữ nguyên code load warehouse
  }

  addNewAssetType(): void {
    // Giữ nguyên code add new asset type
  }

  addNewWarehouse(): void {
    // Giữ nguyên code add new warehouse
  }

  private setupAutoSearchOnBlur(): void {
    // Giữ nguyên code auto search
  }

  private isPhoneOrCccdValidForSearch(): boolean {
    const phone = this.pledgeForm.get('customerInfo.phoneNumber')?.value?.trim() || '';
    const cccd = this.pledgeForm.get('customerInfo.identityNumber')?.value?.trim() || '';
    return (phone.length >= 10 || cccd.length >= 9) && (phone || cccd);
  }
  removeAttachment(i: number): void {
    this.uploadedFiles.splice(i, 1);
    this.cdr.detectChanges();
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
  // === DRAG & DROP ===

  addCollateral(): void {
    const collateralGroup = this.pledgeForm.get('collateralInfo') as FormGroup;
    const attributesArray = collateralGroup.get('attributes') as FormArray;

    // Kiểm tra validate
    if (collateralGroup.invalid) {
      collateralGroup.markAllAsTouched();
      this.findAndFocusFirstInvalidFieldInGroup(collateralGroup);
      this.notification.showError('Vui lòng điền đầy đủ thông tin tài sản (các trường * và thuộc tính bắt buộc).');
      return;
    }

    // Thu thập dữ liệu
    const raw = collateralGroup.getRawValue();
    const assetItem = {
      assetName: raw.assetName,
      assetType: raw.assetType,
      assetCode: raw.assetCode,
      valuation: raw.valuation,
      warehouseId: raw.warehouseId,
      assetNote: raw.assetNote,
      attributes: this.assetAttributes.map((attr, i) => ({
        label: attr.label,
        value: (attributesArray.at(i)?.value || '').trim(),
        required: attr.required
      }))
    };

    // Thêm vào danh sách
    this.collateralList = [...this.collateralList, assetItem];
    this.notification.showSuccess('Đã thêm tài sản vào danh sách!');

    // Lưu lại loại tài sản để giữ khi nhập tiếp
    this.lastSelectedAssetType = raw.assetType;

    // Reset form (giữ lại loại tài sản)
    this.resetCollateralForm();
    this.cdr.detectChanges();
  }
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

  private triggerCustomerSearch(): void {
    // Giữ nguyên
  }


  private findAndFocusFirstInvalidFieldInGroup(group: FormGroup): void {
    const invalidControl = Object.keys(group.controls).find(key => {
      const control = group.get(key);
      return control && control.invalid && (control.dirty || control.touched);
    });

    if (invalidControl) {
      const el = this.el.nativeElement.querySelector(`[formControlName="${invalidControl}"]`);
      if (el) {
        setTimeout(() => {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      return;
    }

    // Kiểm tra attributes
    const attrs = group.get('attributes') as FormArray;
    if (attrs) {
      for (let i = 0; i < attrs.length; i++) {
        const ctrl = attrs.at(i);
        if (ctrl.invalid && (ctrl.dirty || ctrl.touched)) {
          const el = this.el.nativeElement.querySelector(`[formControlName="${i}"]`);
          if (el) {
            setTimeout(() => {
              el.focus();
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
          break;
        }
      }
    }
  }

  private showConfirmAndPopulate(customerData: any): void {
    // Giữ nguyên
  }

  private populateAllCustomerData(data: any): void {
    // Giữ nguyên
  }

  addOrUpdateCollateral(): void {
    const collateralGroup = this.pledgeForm.get('collateralInfo') as FormGroup;
    if (collateralGroup.invalid) {
      collateralGroup.markAllAsTouched();
      this.findAndFocusFirstInvalidFieldInGroup(collateralGroup);
      this.notification.showError('Vui lòng điền đầy đủ thông tin tài sản.');
      return;
    }

    const raw = collateralGroup.getRawValue();
    const assetItem = {
      assetName: raw.assetName,
      assetType: raw.assetType,
      assetCode: raw.assetCode,
      valuation: raw.valuation,
      warehouseId: raw.warehouseId,
      assetNote: raw.assetNote,
      attributes: this.assetAttributes.map((attr, i) => ({
        label: attr.label,
        value: (this.attributesFormArray.at(i)?.value || '').trim(),
        required: attr.required
      }))
    };

    if (this.selectedCollateralIndex !== null) {
      this.collateralList[this.selectedCollateralIndex] = assetItem;
      this.notification.showSuccess('Đã cập nhật tài sản!');
      this.selectedCollateralIndex = null;
    } else {
      this.collateralList = [...this.collateralList, assetItem];
      this.notification.showSuccess('Đã thêm tài sản!');
    }

    this.lastSelectedAssetType = raw.assetType;
    this.resetCollateralForm();
    this.cdr.detectChanges();
  }

  editCollateral(index: number): void {
    const item = this.collateralList[index];
    this.selectedCollateralIndex = index;

    this.pledgeForm.get('collateralInfo')?.patchValue({
      assetName: item.assetName,
      assetType: item.assetType,
      valuation: item.valuation,
      warehouseId: item.warehouseId,
      assetCode: item.assetCode,
      assetNote: item.assetNote
    });

    // Load attributes (trigger valueChanges)
    this.pledgeForm.get('collateralInfo.assetType')?.setValue(item.assetType);

    // Patch attributes values sau khi build controls
    setTimeout(() => {
      item.attributes.forEach((attr: any, i: number) => {
        this.attributesFormArray.at(i).setValue(attr.value);
      });
    }, 0);

    this.cdr.detectChanges();
  }

  private resetCollateralForm(): void {
    const collateralGroup = this.pledgeForm.get('collateralInfo') as FormGroup;
    collateralGroup.reset({
      assetName: '',
      assetType: this.lastSelectedAssetType || '',
      assetCode: '',
      valuation: 0,
      warehouseId: '',
      assetNote: ''
    });
    this.clearAttributes();
    if (this.lastSelectedAssetType) {
      this.pledgeForm.get('collateralInfo.assetType')?.setValue(this.lastSelectedAssetType);
    }
    this.selectedCollateralIndex = null;
  }

  removeCollateral(index: number): void {
    this.collateralList.splice(index, 1);
    this.collateralList = [...this.collateralList];
    this.notification.showSuccess('Đã xóa tài sản.');
    this.cdr.detectChanges();
  }

  viewCollateralDetail(index: number): void {
    const item = this.collateralList[index];
    this.matDialog.open(this.collateralDetailDialog, {
      width: '600px',
      maxHeight: '80vh',
      data: item,
      panelClass: 'collateral-detail-dialog'
    });
  }

  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.notification.showError('Vui lòng điền đầy đủ các trường bắt buộc.');

      // === LOG CHI TIẾT CÁC TRƯỜNG LỖI ===
      const invalidControls: string[] = [];
      const errors: string[] = [];

      // Hàm đệ quy kiểm tra tất cả control trong form
      const findInvalidControls = (control: any, path: string = '') => {
        if (control instanceof FormGroup || control instanceof FormArray) {
          Object.keys(control.controls).forEach(key => {
            const child = control.get(key);
            const newPath = path ? `${path}.${key}` : key;
            findInvalidControls(child, newPath);
          });
        } else {
          if (control.invalid && (control.dirty || control.touched)) {
            invalidControls.push(path);
            const err = control.errors ? Object.keys(control.errors).join(', ') : 'unknown';
            errors.push(`${path}: ${err}`);
          }
        }
      };

      findInvalidControls(this.pledgeForm);

      console.group('Form Invalid - Chi tiết lỗi');
      console.warn('Tổng số trường lỗi:', invalidControls.length);
      console.table(errors.map((e, i) => ({ STT: i + 1, Lỗi: e })));
      console.groupEnd();

      // === Tự động focus vào trường lỗi đầu tiên ===
      this.pledgeForm.markAllAsTouched();
      this.findAndFocusFirstInvalidField();

      return;
    }

    this.isLoading = true;
    const raw = this.pledgeForm.getRawValue();

    const payload: PledgeContract = {
      storeId: this.activeStoreId!,
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
      collateral: this.collateralList  // Gửi mảng collateral
    };

    if (!payload.storeId) {
      this.notification.showError('Lỗi: Mất storeId.');
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

    const serviceCall = this.isEditMode && this.dialogData.contract?.id
      ? this.pledgeService.updatePledge(this.dialogData.contract.id, payload)
      : this.pledgeService.createPledge(payload);

    serviceCall.subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.showSuccess(this.isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.showError(err.error?.message || 'Lỗi khi lưu hợp đồng.');
      }
    });
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
