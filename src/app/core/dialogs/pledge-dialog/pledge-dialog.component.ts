// src/app/core/dialogs/pledge-dialog/pledge-dialog.component.ts
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
  TemplateRef, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Material
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {BehaviorSubject, finalize, Observable, of, take} from 'rxjs';
import { PledgeService, PledgeContract, PledgeUpdatePayload } from '../../services/pledge.service';
import {NotificationService} from '../../services/notification.service';
import {ApiService} from '../../services/api.service';
import {ApiResponse} from '../../services/license.service';
import {catchError, map} from 'rxjs/operators';

type PortraitMode = 'portrait' | 'upload';
interface UserStore { id: string; fullName: string; } // tối thiểu đủ cho UI

@Component({
  selector: 'app-pledge-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatListModule,
    MatTabsModule, MatExpansionModule, MatRadioModule, MatSelectModule, MatTableModule,
    MatTooltipModule, MatProgressBarModule, MatSnackBarModule
  ],
  templateUrl: './pledge-dialog.component.html',
  styleUrls: ['./pledge-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PledgeDialogComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('attachmentInput') attachmentInput!: ElementRef<HTMLInputElement>;
  @ViewChild('collateralDetailDialog') collateralDetailDialogTpl!: TemplateRef<any>;
  followerList$!: Observable<UserStore[]>;
  isLoading = false;
  isEditMode = false;
  isReadOnly = false;

  pledgeForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<PledgeDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: { contractId: string | number | null; storeId: string | null; viewMode?: boolean },
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private pledgeService: PledgeService,
    private snack: MatSnackBar,
    private apiService: ApiService,
    private notification: NotificationService,
  ) {}

  // Dropdown demo
  interestRateUnits$ = new BehaviorSubject<{ id: string; name: string }[]>([
    { id: 'INTEREST_PER_DAY', name: 'Theo ngày' },
    { id: 'INTEREST_PER_MONTH', name: 'Theo tháng' },
    { id: 'INTEREST_PER_YEAR', name: 'Theo năm' }
  ]);

  loanStatuses$ = new BehaviorSubject<{ id: string; name: string }[]>([
    { id: 'dang_vay', name: 'Đang vay' },
    { id: 'da_dong', name: 'Đã đóng' },
    { id: 'tre_han', name: 'Trễ hạn' }
  ]);



  assetTypes$ = new BehaviorSubject<{ id: string; name: string; attributes?: { label: string; required?: boolean }[] }[]>([
    { id: 'xe_may', name: 'Xe máy', attributes: [{ label: 'Biển số' }, { label: 'Số khung' }, { label: 'Số máy' }] },
    { id: 'dtdd', name: 'Điện thoại', attributes: [{ label: 'IMEI', required: true }, { label: 'Màu sắc' }] }
  ]);

  warehouseList$ = new BehaviorSubject<{ id: string; name: string }[]>([
    { id: 'wh1', name: 'Kho 1' },
    { id: 'wh2', name: 'Kho 2' }
  ]);

  // Asset attributes dynamic
  assetAttributes: { label: string; required?: boolean }[] = [];
  get attributesFA(): FormArray { return this.pledgeForm.get('collateralInfo.attributes') as FormArray; }

  collateralList: any[] = [];
  collateralDisplayedColumns = ['assetName', 'assetType', 'assetCode', 'valuation', 'actions', 'view'];

  // Attachments (client demo)
  uploadedFiles: { name: string; file?: File }[] = [];
  isDragOver = false;

  showWebcam = false;

  ngOnInit(): void {
    const storeId = this.dialogData?.storeId;
    this.followerList$ = storeId
      ? this.apiService
        .get<ApiResponse<UserStore[]>>(`/v1/stores/${storeId}/staffs`)
        .pipe(
          map(res => res.data ?? []),
          catchError(() => of([]))
        )
      : of([]);
    this.isEditMode = !!this.dialogData?.contractId;
    this.isReadOnly = !!this.dialogData?.viewMode;

    // ✅ Khởi tạo form trong ngOnInit để tránh lỗi "Property 'fb' is used before its initialization"
    this.pledgeForm = this.fb.group({
      customerInfo: this.fb.group({
        portraitInfo: this.fb.group({ idUrl: [''] }),
        fullName: ['', Validators.required],
        phoneNumber: ['', Validators.required],
        dateOfBirth: [null],
        identityNumber: [''],
        issueDate: [null],
        issuePlace: [''],
        permanentAddress: ['']
      }),

      customerExtraInfo: this.fb.group({
        customerCode: [''],
        occupation: [''],
        workplace: [''],
        householdRegistration: [''],
        email: [''],
        incomeVndPerMonth: [0],
        contactPerson: [''],
        contactPhone: [''],
        note: ['']
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

      loanInfo: this.fb.group({
        loanDate: [null, Validators.required],
        loanAmount: [0, Validators.required],
        interestTermValue: [1],
        interestTermUnit: ['DAY'],
        interestRateValue: [0],
        interestRateUnit: ['INTEREST_PER_DAY'],
        paymentCount: [1],
        interestPaymentType: ['PERIODIC_INTEREST'],
        loanStatus: ['dang_vay'],
        follower: [''],
        assetType: [''],
        note: ['']
      }),

      feesInfo: this.fb.group({
        warehouseFee: this.fb.group({ type: ['AMOUNT'], value: [0] }),
        storageFee: this.fb.group({ type: ['AMOUNT'], value: [0] }),
        riskFee: this.fb.group({ type: ['AMOUNT'], value: [0] }),
        managementFee: this.fb.group({ type: ['AMOUNT'], value: [0] })
      }),

      collateralInfo: this.fb.group({
        assetName: [''],
        assetType: [''],
        valuation: [0],
        warehouseId: [''],
        attributes: this.fb.array([]),
        assetNote: ['']
      }),

      attachments: this.fb.group({})
    });

    if (this.isReadOnly) this.pledgeForm.disable({ emitEvent: false });

    if (this.dialogData?.contractId) {
      this.fetchAndPopulate(this.dialogData.contractId.toString());
    }
  }

  // Load detail from /v1/pledges/:id
  private fetchAndPopulate(id: string): void {
    this.isLoading = true;
    this.pledgeService.getPledgeById(id).pipe(take(1), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (c: PledgeContract) => {
          this.patchFromContract(c);
          this.cdr.markForCheck();
        },
        error: () => this.snack.open('Không tải được chi tiết hợp đồng', 'Đóng', { duration: 2500 })
      });
  }

  private patchFromContract(c: PledgeContract): void {
    this.pledgeForm.patchValue({
      customerInfo: {
        portraitInfo: { idUrl: c.customer?.portraitUrl ?? '' },
        fullName: c.customer?.fullName ?? '',
        phoneNumber: c.customer?.phoneNumber ?? '',
        dateOfBirth: c.customer?.dateOfBirth ? new Date(c.customer.dateOfBirth) : null,
        identityNumber: c.customer?.identityNumber ?? '',
        issueDate: c.customer?.issueDate ? new Date(c.customer.issueDate) : null,
        issuePlace: c.customer?.issuePlace ?? '',
        permanentAddress: c.customer?.permanentAddress ?? ''
      },
      customerExtraInfo: {
        customerCode: c.customer?.customerCode ?? '',
        occupation: c.customer?.occupation ?? '',
        workplace: c.customer?.workplace ?? '',
        householdRegistration: c.customer?.householdRegistration ?? '',
        email: c.customer?.email ?? '',
        incomeVndPerMonth: c.customer?.incomeVndPerMonth ?? 0,
        contactPerson: c.customer?.contactPerson ?? '',
        contactPhone: c.customer?.contactPhone ?? '',
        note: c.customer?.note ?? ''
      },
      familyInfo: {
        spouseName: c.customer?.spouseName ?? '',
        spousePhone: c.customer?.spousePhone ?? '',
        spouseOccupation: c.customer?.spouseOccupation ?? '',
        fatherName: c.customer?.fatherName ?? '',
        fatherPhone: c.customer?.fatherPhone ?? '',
        fatherOccupation: c.customer?.fatherOccupation ?? '',
        motherName: c.customer?.motherName ?? '',
        motherPhone: c.customer?.motherPhone ?? '',
        motherOccupation: c.customer?.motherOccupation ?? ''
      },
      loanInfo: {
        loanDate: c.loan?.loanDate ? new Date(c.loan.loanDate) : null,
        loanAmount: c.loan?.loanAmount ?? 0,
        interestTermValue: c.loan?.interestTermValue ?? 1,
        interestTermUnit: c.loan?.interestTermUnit ?? 'DAY',
        interestRateValue: c.loan?.interestRateValue ?? 0,
        interestRateUnit: c.loan?.interestRateUnit ?? 'INTEREST_PER_DAY',
        paymentCount: c.loan?.paymentCount ?? 1,
        interestPaymentType: c.loan?.interestPaymentType ?? 'PERIODIC_INTEREST',
        loanStatus: c.loan?.loanStatus ?? 'dang_vay',
        follower: c.loan?.follower ?? '',
        assetType: c.loan?.assetTypeId ?? '',
        note: c.loan?.note ?? ''
      },
      feesInfo: {
        warehouseFee: c.fees?.warehouseFee ?? { type: 'AMOUNT', value: 0 },
        storageFee: c.fees?.storageFee ?? { type: 'AMOUNT', value: 0 },
        riskFee: c.fees?.riskFee ?? { type: 'AMOUNT', value: 0 },
        managementFee: c.fees?.managementFee ?? { type: 'AMOUNT', value: 0 }
      }
    });

    this.collateralList = (c.collateral ?? []).map(x => ({
      assetName: x.assetName,
      assetType: x.assetType,
      valuation: x.valuation ?? 0,
      warehouseId: x.warehouseId ?? '',
      assetCode: x.assetCode ?? '',
      assetNote: x.assetNote ?? '',
      attributes: x.attributes ?? []
    }));

    const at = this.pledgeForm.get('loanInfo.assetType')?.value;
    this.onAssetTypeChange(at);
  }

  // Toggle View/Edit
  toggleEdit(): void {
    this.isReadOnly = !this.isReadOnly;
    if (this.isReadOnly) this.pledgeForm.disable({ emitEvent: false });
    else this.pledgeForm.enable({ emitEvent: false });
    this.cdr.markForCheck();
  }

  // Collateral
  onAssetTypeChange(assetTypeId: string): void {
    const def = this.assetTypes$.value.find(x => x.id === assetTypeId);
    this.assetAttributes = def?.attributes ?? [];
    this.attributesFA.clear();
    this.assetAttributes.forEach(() => this.attributesFA.push(this.fb.control('')));
  }

  getAssetTypeName(id: string): string {
    return this.assetTypes$.value.find(x => x.id === id)?.name ?? id ?? '-';
  }
  getWarehouseName(id: string): string {
    return this.warehouseList$.value.find(x => x.id === id)?.name ?? id ?? '-';
  }

  addCollateral(): void {
    const v = this.pledgeForm.get('collateralInfo')!.value as any;
    this.collateralList = [
      ...this.collateralList,
      {
        assetName: v.assetName,
        assetType: v.assetType,
        valuation: v.valuation,
        warehouseId: v.warehouseId,
        assetCode: v.assetCode ?? '',
        assetNote: v.assetNote ?? '',
        attributes: (this.assetAttributes || []).map((a, i) => ({ label: a.label, value: this.attributesFA.at(i).value }))
      }
    ];
    this.pledgeForm.get('collateralInfo')!.reset({
      assetName: '',
      assetType: '',
      valuation: 0,
      warehouseId: '',
      assetNote: ''
    });
    this.attributesFA.clear();
    this.assetAttributes = [];
  }

  removeCollateral(i: number): void {
    const next = [...this.collateralList];
    next.splice(i, 1);
    this.collateralList = next;
  }

  viewCollateralDetail(i: number): void {
    const data = this.collateralList[i];
    this.dialog.open(this.collateralDetailDialogTpl, { data, width: '640px' });
  }

  // Files: portrait & attachments
  takePicture(_: PortraitMode): void {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    this.pledgeForm.get('customerInfo.portraitInfo.idUrl')?.setValue(url);
  }

  onAttachmentClick(): void {
    this.attachmentInput?.nativeElement?.click();
  }

  onAttachmentsSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const mapped = files.map(f => ({ name: f.name, file: f }));
    this.uploadedFiles = [...this.uploadedFiles, ...mapped];
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = true;
  }
  onDragLeave(_: DragEvent): void {
    this.isDragOver = false;
  }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : [];
    const mapped = files.map(f => ({ name: f.name, file: f as File }));
    this.uploadedFiles = [...this.uploadedFiles, ...mapped];
  }
  removeAttachment(i: number): void {
    const next = [...this.uploadedFiles];
    next.splice(i, 1);
    this.uploadedFiles = next;
  }

  onFollowerChange(_: string): void {}

  // Save
  onSave(): void {
    if (this.pledgeForm.invalid) {
      this.pledgeForm.markAllAsTouched();
      return;
    }

    const payload: PledgeUpdatePayload = this.buildPayload();
    this.isLoading = true;

    if (this.isEditMode && this.dialogData.contractId) {
      this.pledgeService.updatePledge(this.dialogData.contractId.toString(), payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.snack.open('Cập nhật thành công', 'Đóng', { duration: 2000 });
            this.dialogRef.close(true);
          },
          error: () => this.snack.open('Cập nhật thất bại', 'Đóng', { duration: 2500 })
        });
    } else {
      this.pledgeService.createPledge(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.snack.open('Tạo mới thành công', 'Đóng', { duration: 2000 });
            this.dialogRef.close(true);
          },
          error: () => this.snack.open('Tạo mới thất bại', 'Đóng', { duration: 2500 })
        });
    }
  }

  private buildPayload(): PledgeUpdatePayload {
    const v: any = this.pledgeForm.value;
    return {
      customer: {
        portraitUrl: v.customerInfo?.portraitInfo?.idUrl || '',
        fullName: v.customerInfo?.fullName || '',
        phoneNumber: v.customerInfo?.phoneNumber || '',
        dateOfBirth: v.customerInfo?.dateOfBirth || null,
        identityNumber: v.customerInfo?.identityNumber || '',
        issueDate: v.customerInfo?.issueDate || null,
        issuePlace: v.customerInfo?.issuePlace || '',
        permanentAddress: v.customerInfo?.permanentAddress || '',
        customerCode: v.customerExtraInfo?.customerCode || '',
        occupation: v.customerExtraInfo?.occupation || '',
        workplace: v.customerExtraInfo?.workplace || '',
        householdRegistration: v.customerExtraInfo?.householdRegistration || '',
        email: v.customerExtraInfo?.email || '',
        incomeVndPerMonth: v.customerExtraInfo?.incomeVndPerMonth || 0,
        contactPerson: v.customerExtraInfo?.contactPerson || '',
        contactPhone: v.customerExtraInfo?.contactPhone || '',
        note: v.customerExtraInfo?.note || '',
        spouseName: v.familyInfo?.spouseName || '',
        spousePhone: v.familyInfo?.spousePhone || '',
        spouseOccupation: v.familyInfo?.spouseOccupation || '',
        fatherName: v.familyInfo?.fatherName || '',
        fatherPhone: v.familyInfo?.fatherPhone || '',
        fatherOccupation: v.familyInfo?.fatherOccupation || '',
        motherName: v.familyInfo?.motherName || '',
        motherPhone: v.familyInfo?.motherPhone || '',
        motherOccupation: v.familyInfo?.motherOccupation || ''
      },
      loan: {
        loanDate: v.loanInfo?.loanDate || null,
        loanAmount: +v.loanInfo?.loanAmount || 0,
        interestTermValue: +v.loanInfo?.interestTermValue || 1,
        interestTermUnit: v.loanInfo?.interestTermUnit || 'DAY',
        interestRateValue: +v.loanInfo?.interestRateValue || 0,
        interestRateUnit: v.loanInfo?.interestRateUnit || 'INTEREST_PER_DAY',
        paymentCount: +v.loanInfo?.paymentCount || 1,
        interestPaymentType: v.loanInfo?.interestPaymentType || 'PERIODIC_INTEREST',
        loanStatus: v.loanInfo?.loanStatus || 'dang_vay',
        follower: v.loanInfo?.follower || '',
        assetTypeId: v.loanInfo?.assetType || '',
        note: v.loanInfo?.note || ''
      },
      fees: v.feesInfo,
      collateral: this.collateralList
    };
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
