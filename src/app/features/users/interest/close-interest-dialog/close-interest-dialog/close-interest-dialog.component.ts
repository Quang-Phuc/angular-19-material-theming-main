import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  TemplateRef,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable ,tap} from 'rxjs';
import { formatCurrency } from '../../../../../core/utils/format.util';

import {
  CloseInterestDetailRow,
  InterestService,
  InterestSummary
} from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ResourceFactory } from '../../../../../core/services/resource-factory.service';
import { SmartTableComponent } from '../../../../../shared/table/smart-table.component';
import { SmartTableColumn, SmartTableAction,TableQuery,PagedResult } from '../../../../../shared/table/smart-table.types';
import { PledgeService, PledgeContract } from '../../../../../core/services/pledge.service';

// ✅ Các dialog popup
import { SettleContractDialogComponent } from '../settle-contract-dialog/settle-contract-dialog.component';
import { ExtendTermDialogComponent } from '../extend-term-dialog/extend-term-dialog.component';
import { PartialPrincipalDialogComponent } from '../partial-principal-dialog/partial-principal-dialog.component';
import { AdditionalLoanDialogComponent } from '../additional-loan-dialog/additional-loan-dialog.component';
import { PayInterestDialogComponent } from '../pay-interest-dialog/pay-interest-dialog.component';

@Component({
  selector: 'app-close-interest-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SmartTableComponent,
    SettleContractDialogComponent,
    ExtendTermDialogComponent,
    PartialPrincipalDialogComponent,
    AdditionalLoanDialogComponent
  ],
  templateUrl: './close-interest-dialog.component.html',
  styleUrls: ['./close-interest-dialog.component.scss'],
  providers: [DatePipe]
})
export class CloseInterestDialogComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private interest = inject(InterestService);
  private cdr = inject(ChangeDetectorRef);
  private resources = inject(ResourceFactory);
  private pledgeService = inject(PledgeService);

  /** TemplateRefs cho SmartTable */
  @ViewChild('sttTpl', { static: true }) sttTpl!: TemplateRef<any>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('totalTpl', { static: true }) totalTpl!: TemplateRef<any>;
  @ViewChild('moneyTpl', { static: true }) moneyTpl!: TemplateRef<any>;


  @ViewChild('table') table!: SmartTableComponent<CloseInterestDetailRow>;
  formatMoney = formatCurrency;
  /** Tóm tắt hợp đồng */
  pledge?: PledgeContract;
  loadingSummary = false;
  activeTab = 0;

  /** Cấu hình cột cho SmartTable */
  columns: SmartTableColumn<CloseInterestDetailRow>[] = [];

  /** Hành động trên từng dòng */
  rowActions: SmartTableAction<CloseInterestDetailRow>[] = [
    {
      icon: 'payments',
      tooltip: 'Đóng lãi',
      color: 'accent',
      handler: (r) => this.openPayInterestDialog(r)
    }
  ];

  /** Hàm fetch dữ liệu (phân trang + filter) */
  fetch = (q: TableQuery): Observable<PagedResult<CloseInterestDetailRow>> => {
    const params = {
      page: q.page,
      size: q.size,
      sort: q.sort,
      order: q.order,
      pledgeId: this.data.pledgeId
    };
    return this.resources.of<CloseInterestDetailRow>('/v1/interests/details').pagePagedResult(params).pipe(
      tap(res => console.log('🔍 DATA FETCHED:', res.items))
    );
  };

  constructor(
    private dialogRef: MatDialogRef<CloseInterestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number }
  ) {}

  /** Khi khởi tạo */
  ngOnInit(): void {
    if (!this.data?.pledgeId) {
      this.notify.showError('Thiếu pledgeId.');
      this.dialogRef.close();
      return;
    }
    this.loadContractInfo();
  }

  /** Khởi tạo cột sau khi ViewChild sẵn sàng */
  ngAfterViewInit(): void {
    this.columns = [
      {
        key: 'stt',
        header: 'STT',
        sortable: false,
        align: 'center',
        width: '60px',
        templateRef: this.sttTpl
      },
      {
        key: 'dueDate',
        header: 'Ngày đến hạn',
        sortable: true,
        align: 'center',
        width: '120px',
        type: 'date',
        templateRef: this.dateTpl
      },
      {
        key: 'interestAmount',
        header: 'Tiền lãi',
        sortable: true,
        align: 'end',
        width: '120px',
        templateRef: this.moneyTpl
      },
      {
        key: 'principalAmount',
        header: 'Tiền gốc',
        sortable: true,
        align: 'end',
        width: '120px',
        templateRef: this.moneyTpl
      },
      {
        key: 'totalAmount',
        header: 'Số tiền cần thanh toán',
        sortable: true,
        align: 'end',
        width: '150px',
        templateRef: this.moneyTpl
      },
      {
        key: 'totalAndDate',
        header: 'Đã thanh toán',
        sortable: true,
        align: 'center',
        width: '200px',
        templateRef: this.totalTpl
      },

      {
        key: 'status',
        header: 'Trạng thái',
        sortable: true,
        align: 'center',
        width: '140px',
        templateRef: this.statusTpl
      }
    ];

    // cập nhật lại view sau khi set cột
    this.cdr.detectChanges();

    setTimeout(() => this.table.reload(), 0);
  }


  /** Tải tổng quan hợp đồng */
  loadContractInfo() {
    this.pledgeService.getPledgeById(this.data.pledgeId).subscribe({
      next: (data) => {
        this.pledge = data;
        this.cdr.markForCheck();
      },
      error: () => this.notify.showError('Không tải được thông tin hợp đồng.')
    });
  }


  /** Popup Đóng lãi */
  openPayInterestDialog(row: CloseInterestDetailRow) {
    this.dialog
      .open(PayInterestDialogComponent, {
        width: '480px',
        data: { pledgeId: this.data.pledgeId, periodNumber: row.periodNumber }
      })
      .afterClosed()
      .subscribe((ok) => ok && this.loadContractInfo());
  }

  /** Xuất PDF/Excel */
  exportFile(type: 'pdf' | 'excel') {
    const tabKey =
      this.activeTab === 0
        ? 'details'
        : this.activeTab === 1
          ? 'contract'
          : this.activeTab === 2
            ? 'payment-history'
            : 'one-time-fees';

    this.interest.export(this.data.pledgeId, tabKey as any, type).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pledge-${this.data.pledgeId}-${tabKey}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notify.showError('Xuất file thất bại.')
    });
  }
  /** 4 Action chung (mở popup) */
  openSettleDialog() {
    this.dialog.open(SettleContractDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.pledge}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openExtendTermDialog() {
    this.dialog.open(ExtendTermDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openPartialPrincipalDialog() {
    this.dialog.open(PartialPrincipalDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.pledge}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openAdditionalLoanDialog() {
    this.dialog.open(AdditionalLoanDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.pledge}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }
  /** Reload tab sau khi POST thành công */
  private reloadCurrentTab() {
    this.loadContractInfo();
    this.loadTab(this.activeTab);
  }
  loadTab(index: number): void {
    this.activeTab = index;

  }

  /** Đóng dialog */
  close() {
    this.dialogRef.close();
  }
}
