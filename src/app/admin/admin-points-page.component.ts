import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Region = 'MB' | 'MN' | 'MT';

interface TicketPoint {
  id: number;
  name: string;
  region: Region;
  province: string;
  district: string;
  address: string;
  hotline: string;
  note?: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-points-page',
  templateUrl: './admin-points-page.component.html',
  styleUrls: ['./admin-points-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminPointsPageComponent {
  regions: Region[] = ['MB', 'MN', 'MT'];

  provincesByRegion: Record<Region, string[]> = {
    MB: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Nam Định'],
    MN: ['Hồ Chí Minh', 'Đồng Nai', 'Bình Dương', 'Cần Thơ', 'Vũng Tàu'],
    MT: ['Đà Nẵng', 'Huế', 'Nha Trang', 'Quảng Nam', 'Bình Định']
  };

  points: TicketPoint[] = [];
  private nextId = 1;

  editingId: number | null = null;

  form: TicketPoint = this.createEmpty('MB');

  private createEmpty(region: Region): TicketPoint {
    return {
      id: 0,
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
    this.editingId = null;
    this.form = this.createEmpty(this.form.region);
  }

  save() {
    if (!this.form.name.trim() || !this.form.address.trim()) {
      alert('Tên điểm bán và địa chỉ là bắt buộc.');
      return;
    }

    if (this.editingId == null) {
      const copy: TicketPoint = { ...this.form, id: this.nextId++ };
      this.points = [...this.points, copy];
    } else {
      this.points = this.points.map(p =>
        p.id === this.editingId ? { ...this.form, id: this.editingId! } : p
      );
    }
    this.resetForm();
  }

  edit(point: TicketPoint) {
    this.editingId = point.id;
    this.form = { ...point };
  }

  remove(point: TicketPoint) {
    if (!confirm(`Xoá điểm "${point.name}"?`)) return;
    this.points = this.points.filter(p => p.id !== point.id);
    if (this.editingId === point.id) {
      this.resetForm();
    }
  }

  getRegionLabel(r: Region): string {
    if (r === 'MB') return 'Miền Bắc';
    if (r === 'MN') return 'Miền Nam';
    return 'Miền Trung';
  }
}
