import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LotteryDraw } from './models/lottery-draw.model';
import { Region } from './models/ticket-point.model';
import {LotteryAdminService} from '../core/services/lottery-admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-lottery-page',
  templateUrl: './admin-lottery-page.component.html',
  styleUrls: ['./admin-lottery-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminLotteryPageComponent implements OnInit {

  regions: Region[] = ['MB', 'MN', 'MT'];

  provincesByRegion: Record<Region, string[]> = {
    MB: ['Miền Bắc'],
    MN: ['TP.HCM', 'Đồng Nai', 'Cần Thơ', 'Sóc Trăng'],
    MT: ['Đà Nẵng', 'Khánh Hoà', 'Đắk Lắk', 'Gia Lai']
  };

  draws: LotteryDraw[] = [];
  editingId: number | null = null;

  form: LotteryDraw = this.empty('MB');

  loading = false;

  constructor(
    private router: Router,
    private lotteryAdmin: LotteryAdminService
  ) {}

  ngOnInit(): void {
    // check login đơn giản
    if (localStorage.getItem('admin_logged') !== 'true') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  private empty(region: Region): LotteryDraw {
    const today = new Date().toISOString().slice(0, 10);
    return {
      region,
      province: this.provincesByRegion[region][0],
      drawDate: today,
      gDB: '',
      g1: '',
      g2: '',
      g3: '',
      g4: '',
      g5: '',
      g6: '',
      g7: ''
    };
  }

  load(): void {
    this.loading = true;
    this.lotteryAdmin.list().subscribe({
      next: res => {
        this.draws = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Không tải được danh sách kỳ quay.');
      }
    });
  }

  onRegionChange(): void {
    const list = this.provincesByRegion[this.form.region];
    if (!list.includes(this.form.province)) {
      this.form.province = list[0];
    }
  }

  reset(): void {
    const region = this.form.region;
    this.editingId = null;
    this.form = this.empty(region);
  }

  save(): void {
    if (!this.form.drawDate || !this.form.gDB.trim()) {
      alert('Ngày quay và giải Đặc Biệt là bắt buộc.');
      return;
    }

    const payload: LotteryDraw = { ...this.form };

    if (this.editingId == null) {
      this.lotteryAdmin.create(payload).subscribe({
        next: () => {
          this.load();
          this.reset();
        },
        error: () => alert('Lỗi khi lưu kỳ quay mới.')
      });
    } else {
      this.lotteryAdmin.update(this.editingId, payload).subscribe({
        next: () => {
          this.load();
          this.reset();
        },
        error: () => alert('Lỗi khi cập nhật kỳ quay.')
      });
    }
  }

  edit(d: LotteryDraw): void {
    this.editingId = d.id!;
    this.form = { ...d };
  }

  remove(d: LotteryDraw): void {
    if (!confirm('Xoá kỳ quay này?')) return;
    this.lotteryAdmin.delete(d.id!).subscribe({
      next: () => this.load(),
      error: () => alert('Lỗi khi xoá.')
    });
  }

  // helper hiển thị dãy số đẹp
  formatMulti(value?: string): string[] {
    if (!value || !value.trim()) return [];
    return value
      .split(/[,\s]+/)
      .map(x => x.trim())
      .filter(x => x);
  }
}
