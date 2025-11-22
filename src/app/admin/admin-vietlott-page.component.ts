import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VietlottResult, VietlottGame } from './models/vietlott-result.model';
import {VietlottService} from '../core/services/vietlott.service';

@Component({
  standalone: true,
  selector: 'app-admin-vietlott-page',
  templateUrl: './admin-vietlott-page.component.html',
  styleUrls: ['./admin-vietlott-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminVietlottPageComponent implements OnInit {

  games: { value: VietlottGame; label: string }[] = [
    { value: 'POWER_655', label: 'Power 6/55' },
    { value: 'MEGA_645', label: 'Mega 6/45' },
    { value: 'MAX_3D', label: 'Max 3D' },
    { value: 'MAX_3D_PLUS', label: 'Max 3D+' },
    { value: 'KENO', label: 'Keno' }
  ];

  results: VietlottResult[] = [];
  editingId: number | null = null;

  form: VietlottResult = this.empty();
  loading = false;

  constructor(
    private router: Router,
    private vietlottService: VietlottService
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('admin_logged') !== 'true') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  private empty(): VietlottResult {
    const today = new Date().toISOString().slice(0, 10);
    return {
      drawDate: today,
      game: 'POWER_655',
      code: '',
      numbers: '',
      extra: '',
      jackpot: '',
      note: ''
    };
  }

  load(): void {
    this.loading = true;
    this.vietlottService.list().subscribe({
      next: res => {
        this.results = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Không tải được dữ liệu Vietlott.');
      }
    });
  }

  reset(): void {
    this.editingId = null;
    this.form = this.empty();
  }

  save(): void {
    if (!this.form.drawDate || !this.form.numbers.trim()) {
      alert('Ngày quay và dãy số là bắt buộc.');
      return;
    }

    const payload: VietlottResult = { ...this.form };

    if (this.editingId == null) {
      this.vietlottService.create(payload).subscribe({
        next: () => {
          this.load();
          this.reset();
        },
        error: () => alert('Lỗi khi lưu kỳ quay Vietlott.')
      });
    } else {
      this.vietlottService.update(this.editingId, payload).subscribe({
        next: () => {
          this.load();
          this.reset();
        },
        error: () => alert('Lỗi khi cập nhật kỳ quay Vietlott.')
      });
    }
  }

  edit(r: VietlottResult): void {
    this.editingId = r.id!;
    this.form = { ...r };
  }

  remove(r: VietlottResult): void {
    if (!confirm('Xoá kỳ quay này?')) return;
    this.vietlottService.delete(r.id!).subscribe({
      next: () => this.load(),
      error: () => alert('Lỗi khi xoá Vietlott.')
    });
  }

  gameLabel(g: VietlottGame): string {
    return this.games.find(x => x.value === g)?.label ?? g;
  }
}
