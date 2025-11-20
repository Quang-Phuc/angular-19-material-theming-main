import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type RegionKey = 'MB' | 'MN' | 'MT';
type RegionFilter = 'ALL' | RegionKey;

interface TicketPoint {
  id: number;
  name: string;
  region: RegionKey;          // MB / MN / MT
  province: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  hotline?: string;
  openTime?: string;
  tags?: string[];
  distanceKm?: number;        // được set khi bật "Gần tôi"
}

@Component({
  standalone: true,
  selector: 'app-ticket-points-page',
  templateUrl: './ticket-points-page.component.html',
  styleUrls: ['./ticket-points-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class TicketPointsPageComponent implements OnInit {

  // ====== MOCK DATA DEMO ======
  private allPoints: TicketPoint[] = [
    {
      id: 1,
      name: 'Đại Lý Vé Số Minh Anh',
      region: 'MB',
      province: 'Hà Nội',
      district: 'Đống Đa',
      address: '125 Tây Sơn, Đống Đa, Hà Nội',
      lat: 21.013356,
      lng: 105.820116,
      hotline: '0988 123 456',
      openTime: '07:00 – 21:30',
      tags: ['XSMB', 'Vietlott', 'In vé', 'Giao tận nơi']
    },
    {
      id: 2,
      name: 'Cửa Hàng Vé Số Thần Đèn',
      region: 'MB',
      province: 'Hà Nội',
      district: 'Hoàn Kiếm',
      address: '12 Hàng Bài, Hoàn Kiếm, Hà Nội',
      lat: 21.020126,
      lng: 105.851779,
      hotline: '0903 555 777',
      openTime: '08:00 – 22:00',
      tags: ['XSMB', 'Vietlott', 'Thanh toán QR']
    },
    {
      id: 3,
      name: 'Đại Lý Vé Số Miền Nam An Phú',
      region: 'MN',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 2 (TP Thủ Đức)',
      address: '23 Nguyễn Thị Định, An Phú, TP. Thủ Đức',
      lat: 10.802251,
      lng: 106.746072,
      hotline: '0938 222 333',
      openTime: '06:30 – 21:00',
      tags: ['XSMN', 'Vietlott']
    },
    {
      id: 4,
      name: 'Điểm Bán Vietlott Trung Tâm',
      region: 'MN',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      address: '5 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
      lat: 10.772021,
      lng: 106.699215,
      hotline: '0933 999 000',
      openTime: '08:00 – 23:00',
      tags: ['Vietlott', 'Power 6/55', 'Mega 6/45']
    },
    {
      id: 5,
      name: 'Đại Lý Xổ Số Miền Trung Hồng Phúc',
      region: 'MT',
      province: 'Đà Nẵng',
      district: 'Hải Châu',
      address: '89 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      lat: 16.06252,
      lng: 108.21808,
      hotline: '0912 888 666',
      openTime: '07:30 – 21:00',
      tags: ['XSMT', 'Vietlott']
    }
  ];

  // ====== STATE UI ======
  keyword = '';
  regionFilter: RegionFilter = 'ALL';
  provinceFilter = 'ALL';
  nearbyMode = false;

  filtered: TicketPoint[] = [];
  provincesOfRegion: string[] = [];

  myLocation: { lat: number; lng: number } | null = null;
  loadingGeo = false;
  geoError = '';

  selected: TicketPoint | null = null;
  mapUrl: SafeResourceUrl | null = null;

  // ====== ctor ======
  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.buildProvinceList();
    this.applyFilters();
  }

  // ====== FILTER / SORT ======

  setRegionFilter(region: RegionFilter): void {
    this.regionFilter = region;
    this.provinceFilter = 'ALL';
    this.buildProvinceList();
    this.applyFilters();
  }

  setProvinceFilter(p: string): void {
    this.provinceFilter = p;
    this.applyFilters();
  }

  private buildProvinceList(): void {
    const regions = this.regionFilter === 'ALL'
      ? this.allPoints
      : this.allPoints.filter(p => p.region === this.regionFilter);

    const set = new Set<string>();
    regions.forEach(p => set.add(p.province));
    this.provincesOfRegion = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  onKeywordChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let list = [...this.allPoints];

    if (this.regionFilter !== 'ALL') {
      list = list.filter(p => p.region === this.regionFilter);
    }
    if (this.provinceFilter !== 'ALL') {
      list = list.filter(p => p.province === this.provinceFilter);
    }
    const kw = this.keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.address.toLowerCase().includes(kw) ||
        p.district.toLowerCase().includes(kw) ||
        p.province.toLowerCase().includes(kw)
      );
    }

    if (this.nearbyMode && this.myLocation) {
      list.forEach(p => {
        p.distanceKm = this.distanceKm(
          this.myLocation!.lat,
          this.myLocation!.lng,
          p.lat,
          p.lng
        );
      });
      list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filtered = list;
    if (!this.selected || !this.filtered.includes(this.selected)) {
      this.selected = this.filtered.length ? this.filtered[0] : null;
      this.updateMap();
    }
  }

  // ====== NEARBY / GEO ======

  toggleNearby(): void {
    if (this.nearbyMode) {
      // tắt chế độ gần tôi
      this.nearbyMode = false;
      this.applyFilters();
      return;
    }

    // bật "Gần tôi"
    if (!navigator.geolocation) {
      this.geoError = 'Trình duyệt không hỗ trợ định vị.';
      return;
    }
    this.loadingGeo = true;
    this.geoError = '';

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.loadingGeo = false;
        this.myLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        this.nearbyMode = true;
        this.applyFilters();
      },
      err => {
        this.loadingGeo = false;
        this.geoError = 'Không lấy được vị trí, hãy kiểm tra quyền truy cập GPS.';
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // làm tròn 0.1 km
  }

  // ====== LIST / MAP ======

  selectPoint(p: TicketPoint): void {
    this.selected = p;
    this.updateMap();
  }

  private updateMap(): void {
    if (!this.selected) {
      this.mapUrl = null;
      return;
    }
    const url = `https://www.google.com/maps?q=${this.selected.lat},${this.selected.lng}&z=16&output=embed`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  buildDirectionsUrl(p: TicketPoint): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  }

  trackById(_index: number, item: TicketPoint): number {
    return item.id;
  }
}
