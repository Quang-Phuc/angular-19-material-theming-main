// src/app/features/interest/close-interest-dialog/close-interest-dialog.component.ts
import {ChangeDetectorRef, Component, Inject, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
  CloseInterestDetailRow, ContractInfo, InterestHistoryRow, InterestService, InterestSummary, OneTimeFeeRow
} from '../../../../core/services/interest.service';
import {NotificationService} from '../../../../core/services/notification.service';

// 4 popup actions
import {SettleContractDialogComponent} from './settle-contract-dialog.component';
import {ExtendTermDialogComponent} from './extend-term-dialog.component';
import {PartialPrincipalDialogComponent} from './partial-principal-dialog.component';
import {AdditionalLoanDialogComponent} from './additional-loan-dialog.component';

@Component({
  selector: 'app-close-interest-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTabsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, SettleContractDialogComponent, ExtendTermDialogComponent, PartialPrincipalDialogComponent, AdditionalLoanDialogComponent],
  templateUrl: './close-interest-dialog.component.html',
  styleUrls: ['./close-interest-dialog.component.scss'],
  providers: [DatePipe]
})
export class CloseInterestDialogComponent implements OnInit {
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private interest = inject(InterestService);
  private cdr = inject(ChangeDetectorRef);

  summary?: InterestSummary;
  loadingSummary = false;

  // Tab index: 0-1-2-3
  activeTab = 0;

  // Tab 1: Chi tiết đóng lãi
  detailsLoading = false;
  details: CloseInterestDetailRow[] = [];
  detailsColumns = ['periodNumber', 'dueDate', 'interestAmount', 'principalAmount', 'totalAmount', 'status', 'paidDate'];
  detailsPage = 0;
  detailsSize = 10;
  detailsTotal = 0;

  // Tab 2: Thông tin HĐ
  contractLoading = false;
  contract?: ContractInfo;

  // Tab 3: Lịch sử đóng lãi
  payHistLoading = false;
  payHist: InterestHistoryRow[] = [];
  payHistColumns = ['createdAt', 'periodNumber', 'amount', 'note', 'cashier'];
  payHistPage = 0;
  payHistSize = 10;
  payHistTotal = 0;

  // Tab 4: Lịch sử thu phí 1 lần
  feeHistLoading = false;
  feeHist: OneTimeFeeRow[] = [];
  feeHistColumns = ['createdAt', 'feeType', 'amount', 'note', 'cashier'];
  feeHistPage = 0;
  feeHistSize = 10;
  feeHistTotal = 0;

  @ViewChild('detailsPaginator') detailsPaginator?: MatPaginator;
  @ViewChild('payHistPaginator') payHistPaginator?: MatPaginator;
  @ViewChild('feeHistPaginator') feeHistPaginator?: MatPaginator;

  constructor(private dialogRef: MatDialogRef<CloseInterestDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: {
    pledgeId: number
  }) {
  }

  ngOnInit(): void {
    if (!this.data?.pledgeId) {
      this.notify.showError('Thiếu pledgeId.');
      this.dialogRef.close();
      return;
    }
    this.loadSummary();
    this.loadTab(this.activeTab);
  }

  /** Header summary */
  private loadSummary(): void {
    this.loadingSummary = true;
    this.interest.getSummary(this.data.pledgeId).subscribe({
      next: res => {
        this.summary = res.data;
        this.loadingSummary = false;
        this.cdr.markForCheck();
      }, error: () => {
        this.loadingSummary = false;
        this.notify.showError('Không tải được tổng quan hợp đồng.');
      }
    });
  }

  /** Lazy load theo tab */
  loadTab(index: number): void {
    this.activeTab = index;
    switch (index) {
      case 0:
        this.loadDetails();
        break;
      case 1:
        this.loadContract();
        break;
      case 2:
        this.loadPayHistory();
        break;
      case 3:
        this.loadFeeHistory();
        break;
    }
  }

  // Tab 1
  loadDetails(): void {
    this.detailsLoading = true;
    this.interest.getDetails(this.data.pledgeId, this.detailsPage, this.detailsSize).subscribe({
      next: res => {
        const p = res.data;
        this.details = p.content ?? [];
        this.detailsTotal = p.totalElements ?? 0;
        this.detailsLoading = false;
      }, error: () => {
        this.detailsLoading = false;
        this.notify.showError('Không tải được chi tiết đóng lãi.');
      }
    });
  }

  onDetailsPage(ev: PageEvent) {
    this.detailsPage = ev.pageIndex;
    this.detailsSize = ev.pageSize;
    this.loadDetails();
  }

  // Tab 2
  loadContract(): void {
    this.contractLoading = true;
    this.interest.getContract(this.data.pledgeId).subscribe({
      next: res => {
        this.contract = res.data;
        this.contractLoading = false;
      }, error: () => {
        this.contractLoading = false;
        this.notify.showError('Không tải được thông tin hợp đồng.');
      }
    });
  }

  // Tab 3
  loadPayHistory(): void {
    this.payHistLoading = true;
    this.interest.getInterestHistory(this.data.pledgeId, this.payHistPage, this.payHistSize).subscribe({
      next: res => {
        const p = res.data;
        this.payHist = p.content ?? [];
        this.payHistTotal = p.totalElements ?? 0;
        this.payHistLoading = false;
      }, error: () => {
        this.payHistLoading = false;
        this.notify.showError('Không tải được lịch sử đóng lãi.');
      }
    });
  }

  onPayHistPage(ev: PageEvent) {
    this.payHistPage = ev.pageIndex;
    this.payHistSize = ev.pageSize;
    this.loadPayHistory();
  }

  // Tab 4
  loadFeeHistory(): void {
    this.feeHistLoading = true;
    this.interest.getOneTimeFees(this.data.pledgeId, this.feeHistPage, this.feeHistSize).subscribe({
      next: res => {
        const p = res.data;
        this.feeHist = p.content ?? [];
        this.feeHistTotal = p.totalElements ?? 0;
        this.feeHistLoading = false;
      }, error: () => {
        this.feeHistLoading = false;
        this.notify.showError('Không tải được lịch sử thu phí.');
      }
    });
  }

  onFeeHistPage(ev: PageEvent) {
    this.feeHistPage = ev.pageIndex;
    this.feeHistSize = ev.pageSize;
    this.loadFeeHistory();
  }

  /** 4 Action chung (mở popup) */
  openSettleDialog() {
    this.dialog.open(SettleContractDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.summary}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openExtendTermDialog() {
    this.dialog.open(ExtendTermDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openPartialPrincipalDialog() {
    this.dialog.open(PartialPrincipalDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.summary}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  openAdditionalLoanDialog() {
    this.dialog.open(AdditionalLoanDialogComponent, {
      width: '520px', data: {pledgeId: this.data.pledgeId, summary: this.summary}
    }).afterClosed().subscribe(ok => ok && this.reloadCurrentTab());
  }

  /** Export theo tab hiện tại */
  exportFile(type: 'pdf' | 'excel') {
    const tabKey = this.activeTab === 0 ? 'details' : this.activeTab === 1 ? 'contract' : this.activeTab === 2 ? 'payment-history' : 'one-time-fees';
    this.interest.export(this.data.pledgeId, tabKey as any, type).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `pledge-${this.data.pledgeId}-${tabKey}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }, error: () => this.notify.showError('Xuất file thất bại.')
    });
  }

  /** Reload tab sau khi POST thành công */
  private reloadCurrentTab() {
    this.loadSummary();
    this.loadTab(this.activeTab);
  }

  close() {
    this.dialogRef.close();
  }
}
