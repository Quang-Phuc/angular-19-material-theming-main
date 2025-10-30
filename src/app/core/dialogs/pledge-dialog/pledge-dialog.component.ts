// src/app/core/dialogs/pledge-dialog/pledge-dialog.component.ts

import { Component, OnInit, inject, Inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../services/notification.service';
import { PledgeService, PledgeContract } from '../../services/pledge.service';
import { Observable, of, BehaviorSubject } from 'rxjs';

interface DropdownOption { id: string; name: string; }

interface AssetTypeAttribute {
  label: string;
  value?: string;
}

interface AssetType {
  maLoai: string;
  tenLoai: string;
  trangThai: string;
  attributes: AssetTypeAttribute[];
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
export class PledgeDialogComponent implements OnInit, OnDestroy {
  pledgeForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  showAdvancedInfo = false;
  showWebcam = false;
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  assetTypes$ = new BehaviorSubject<string[]>(['Xe Máy', 'Ô tô', 'Điện thoại', 'Laptop', 'Vàng/Trang sức']);
  tinhTrangList$: Observable<string[]> = of(['Bình Thường', 'Bình Thường 2', 'Nợ rủi ro', 'Nợ R2', 'Nợ R3', 'Nợ xấu']);
  doiTacList$: Observable<DropdownOption[]> = of([
    { id: 'chu_no', name: 'Chủ nợ' }, { id: 'khach_hang', name: 'Khách hàng' }, { id: 'nguoi_theo_doi', name: 'Người theo dõi' },
    { id: 'all', name: 'Tất cả' }, { id: 'huebntest', name: 'huebntest' }, { id: 'hue_2', name: 'Huệ 2' }
  ]);
  nguoiTheoDoiList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'user_1', name: 'User 1' }]);
  nguonKhachHangList$: Observable<DropdownOption[]> = of([{ id: 'all', name: 'Tất cả' }, { id: 'ctv', name: 'CTV' }]);
  khoList$: Observable<DropdownOption[]> = of([{ id: 'kho_1', name: 'Kho 1' }, { id: 'kho_2', name: 'Kho 2' }]);

  // Attachments
  uploadedFiles: { name: string; url: string }[] = [];
  isDragOver = false;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PledgeDialogComponent>);
  @Inject(MAT_DIALOG_DATA) public data: PledgeContract | null = inject(MAT_DIALOG_DATA);
  private notification = inject(NotificationService);
  private pledgeService = inject(PledgeService);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private stream: MediaStream | null = null;

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
    this.stopWebcam();
  }

  patchFormData(contract: PledgeContract): void {
    this.pledgeForm.patchValue({ /* ... */ });
    this.pledgeForm.get('loanInfo.maHopDong')?.disable();
  }

  async takePicture(field: string): Promise<void> {
    if (field === 'portrait') {
      this.showWebcam = true;
      this.notification.showInfo('Đang truy cập webcam...');
      // Wait for DOM to update
      setTimeout(async () => {
        if (!this.videoElement || !this.videoElement.nativeElement) {
          this.notification.showError('Không thể truy cập phần tử video. Vui lòng thử lại.');
          this.showWebcam = false;
          return;
        }
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.play();
          this.cdr.detectChanges(); // Ensure DOM is updated
        } catch (error) {
          this.notification.showError('Không thể truy cập webcam. Vui lòng kiểm tra quyền hoặc thử tải ảnh lên.');
          this.showWebcam = false;
          console.error('Webcam access error:', error);
        }
      }, 0);
    } else if (field === 'upload') {
      if (this.fileInput && this.fileInput.nativeElement) {
        this.fileInput.nativeElement.click();
      } else {
        this.notification.showError('Không thể truy cập input file. Vui lòng thử lại.');
      }
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) {
      this.notification.showError('Không thể chụp ảnh do lỗi giao diện. Vui lòng thử lại.');
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      this.notification.showError('Không thể truy cập canvas context.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (imageDataUrl.length > 1024 * 1024) {
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
      if (file.size > 1024 * 1024) {
        this.notification.showError('File ảnh vượt quá 1MB. Vui lòng chọn file nhỏ hơn.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.pledgeForm.get('portraitInfo.imageUrl')?.setValue(result);
        this.notification.showSuccess('Đã tải ảnh lên thành công!');
        this.cdr.detectChanges(); // Update DOM to show preview
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
    this.cdr.detectChanges();
  }

  // Attachment handling
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      Array.from(files).forEach(file => this.handleFileUpload(file));
    }
  }

  onAttachmentClick(): void {
    // Trigger hidden file input for attachments if needed
    // For now, use the same logic as portrait
    const attachmentInput = document.createElement('input');
    attachmentInput.type = 'file';
    attachmentInput.multiple = true;
    attachmentInput.accept = 'image/*,.pdf,.doc,.docx';
    attachmentInput.onchange = (e: any) => {
      if (e.target.files) {
        Array.from(e.target.files as FileList).forEach((file: File) => this.handleFileUpload(file));
      }
    };
    attachmentInput.click();
  }

  private handleFileUpload(file: File): void {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit for attachments
      this.notification.showError(`File ${file.name} vượt quá 5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      this.uploadedFiles.push({ name: file.name, url });
      this.pledgeForm.get('attachments')?.patchValue(this.uploadedFiles);
      this.notification.showSuccess(`Đã tải ${file.name} thành công!`);
      this.cdr.detectChanges();
    };
    reader.onerror = () => {
      this.notification.showError(`Lỗi khi đọc file ${file.name}.`);
    };
    reader.readAsDataURL(file);
  }

  removeAttachment(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.pledgeForm.get('attachments')?.patchValue(this.uploadedFiles);
    this.cdr.detectChanges();
  }

  // Asset type addition
  addNewAssetType(): void {
    const dialogRef = this.matDialog.open(AddAssetTypeDialogComponent, {
      width: '500px',
      data: { assetTypes: this.assetTypes$.value }
    });

    dialogRef.afterClosed().subscribe((result: AssetType | undefined) => {
      if (result) {
        const currentTypes = this.assetTypes$.value;
        currentTypes.push(result.tenLoai);
        this.assetTypes$.next(currentTypes);
        this.notification.showSuccess('Thêm loại tài sản thành công!');
      }
    });
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
      collateral: formData.collateralInfo,
      attachments: formData.attachments
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
}

// New Dialog Component for Adding Asset Type
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
        <!-- Thông tin chung -->
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

        <!-- Cấu hình thuộc tính hàng hóa -->
        <div class="info-section">
          <h3>Cấu hình thuộc tính hàng hóa</h3>
          <div formArrayName="attributes">
            <div *ngFor="let attrGroup of attributesArray.controls; let i = index" [formGroupName]="i" class="attribute-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Thuộc tính {{ i + 1 }} (VD: Biển số xe)</mat-label>
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
    .form-grid-2-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: center; }
    .full-width { width: 100%; }
  `]
})
export class AddAssetTypeDialogComponent {
  assetTypeForm: FormGroup;
  attributesArray: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddAssetTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assetTypes: string[] }
  ) {
    this.assetTypeForm = this.fb.group({
      maLoai: ['', Validators.required],
      tenLoai: ['', Validators.required],
      trangThai: ['Bình thường'],
      attributes: this.fb.array([
        this.fb.group({ label: [''] })
      ])
    });
    this.attributesArray = this.assetTypeForm.get('attributes') as any;
  }

  addAttribute(): void {
    this.attributesArray.push(this.fb.group({ label: [''] }));
  }

  removeAttribute(index: number): void {
    this.attributesArray.removeAt(index);
  }

  onSave(): void {
    if (this.assetTypeForm.valid) {
      const formValue = this.assetTypeForm.value;
      const newAssetType: AssetType = {
        maLoai: formValue.maLoai,
        tenLoai: formValue.tenLoai,
        trangThai: formValue.trangThai,
        attributes: formValue.attributes
      };
      this.dialogRef.close(newAssetType);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
