import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import {TicketPoint} from './models/ticket-point.model';

@Component({
  standalone: true,
  selector: 'app-admin-points-page',
  templateUrl: './admin-points-page.component.html',
  styleUrls: ['./admin-points-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminPointsPageComponent implements OnInit {

  regions: Array<'MB'|'MN'|'MT'> = ['MB','MN','MT'];
  provincesByRegion: Record<string,string[]> = {
    MB: ['Hà Nội','Hải Phòng','Quảng Ninh','Thái Bình','Nam Định'],
    MN: ['TP. Hồ Chí Minh','Đồng Nai','Bình Dương','Tây Ninh'],
    MT: ['Đà Nẵng','Huế','Khánh Hòa','Quảng Nam']
  };

  points: TicketPoint[] = [];
  editingId?: number;

  form: TicketPoint = {
    name: '', region: 'MB', province: 'Hà Nội', address: '',
    hasXsmb: true, hasVietlott: true,
    openTime: '08:00', closeTime: '22:00'
  };

  // map
  map?: L.Map;
  marker?: L.Marker;
  picking = false;   // bật modal chọn map

  ngOnInit() {
    // TODO: load points từ API
  }

  onRegionChange() {
    const first = this.provincesByRegion[this.form.region][0];
    if (!this.form.province || !this.provincesByRegion[this.form.region].includes(this.form.province)) {
      this.form.province = first;
    }
  }

  edit(p: TicketPoint) {
    this.editingId = p.id;
    this.form = { ...p }; // clone
    this.onRegionChange();
  }

  remove(p: TicketPoint) {
    if (!confirm('Xóa điểm bán này?')) return;
    // TODO: call API delete
    this.points = this.points.filter(x => x !== p);
  }

  resetForm() {
    this.editingId = undefined;
    this.form = {
      name: '', region: 'MB', province: 'Hà Nội', address: '',
      hasXsmb: true, hasVietlott: true,
      openTime: '08:00', closeTime: '22:00'
    };
  }

  save() {
    // Validate tối thiểu
    if (!this.form.name?.trim() || !this.form.address?.trim()) {
      alert('Tên & địa chỉ là bắt buộc.');
      return;
    }
    // TODO: call API create/update
    if (this.editingId) {
      const i = this.points.findIndex(p => p.id === this.editingId);
      this.points[i] = { ...this.form };
    } else {
      this.points.unshift({ ...this.form, id: Date.now() });
    }
    this.resetForm();
  }

  // ===== Map modal (Leaflet + OSM) =====
  openPickMap() {
    this.picking = true;
    setTimeout(() => this.initMap(), 0);
  }

  closePickMap() {
    this.picking = false;
    // destroy map để tránh leak
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  private initMap() {
    const lat = this.form.lat ?? 21.0278; // Hà Nội
    const lng = this.form.lng ?? 105.8342;

    this.map = L.map('pickMap', { center: [lat, lng], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap' }).addTo(this.map);

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const c = (this.marker as L.Marker).getLatLng();
      this.form.lat = c.lat;
      this.form.lng = c.lng;
    });

    // click đặt marker
    this.map.on('click', (e: any) => {
      const c = e.latlng;
      (this.marker as L.Marker).setLatLng(c);
      this.form.lat = c.lat; this.form.lng = c.lng;
    });

    // dùng vị trí hiện tại
    if (navigator.geolocation && (!this.form.lat || !this.form.lng)) {
      navigator.geolocation.getCurrentPosition(pos => {
        const c = L.latLng(pos.coords.latitude, pos.coords.longitude);
        this.map?.setView(c, 15);
        (this.marker as L.Marker).setLatLng(c);
        this.form.lat = c.lat; this.form.lng = c.lng;
      });
    }
  }
}
