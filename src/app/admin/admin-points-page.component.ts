// src/app/admin/admin-points-page.component.ts (bản dùng API)
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketPoint, Region } from './models/ticket-point.model';
import {TicketPointService} from '../core/services/ticket-point.service';

@Component({
  standalone: true,
  selector: 'app-admin-points-page',
  templateUrl: './admin-points-page.component.html',
  styleUrls: ['./admin-points-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminPointsPageComponent implements OnInit {
  regions: Region[] = ['MB', 'MN', 'MT'];

  provincesByRegion: Record<Region, string[]> = {
    MB: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Nam Định'],
    MN: ['Hồ Chí Minh', 'Đồng Nai', 'Bình Dương', 'Cần Thơ', 'Vũng Tàu'],
    MT: ['Đà Nẵng', 'Huế', 'Nha Trang', 'Quảng Nam', 'Bình Định']
  };

  points: TicketPoint[] = [];
  editingId: number | null = null;

  form: TicketPoint = this.createEmpty('MB');

  constructor(private pointService: TicketPointService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.pointService.list().subscribe(res => this.points = res);
  }

  private createEmpty(region: Region): TicketPoint {
    return {
      name: '',
      region,
      province: this.provincesByRegion[region][0],
      district: '',
      address: '',
      hotline: '',
      note: ''
    };
  }

  onRegionChange() {
    const region = this.form.region;
    const list = this.provincesByRegion[region];
    if (!list.includes(this.form.province)) {
      this.form.province = list[0];
    }
  }

  resetForm() {
    const region = this.form.region;
    this.editingId = null;
    this.form = this.createEmpty(region);
  }

  save() {
    if (!this.form.name.trim() || !this.form.address.trim()) {
      alert('Tên điểm bán và địa chỉ là bắt buộc.');
      return;
    }

    if (this.editingId == null) {
      this.pointService.create(this.form).subscribe(() => {
        this.load();
        this.resetForm();
      });
    } else {
      this.pointService.update(this.editingId, this.form).subscribe(() => {
        this.load();
        this.resetForm();
      });
    }
  }

  edit(p: TicketPoint) {
    this.editingId = p.id!;
    this.form = { ...p };
  }

  remove(p: TicketPoint) {
    if (!confirm(`Xoá "${p.name}"?`)) return;
    this.pointService.delete(p.id!).subscribe(() => this.load());
  }

  getRegionLabel(r: Region): string {
    if (r === 'MB') return 'Miền Bắc';
    if (r === 'MN') return 'Miền Nam';
    return 'Miền Trung';
  }
}
