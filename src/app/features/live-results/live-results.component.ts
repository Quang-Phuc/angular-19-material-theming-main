// src/app/features/live-results/live-results.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

type RegionKey = 'XSMB' | 'VIETLOTT';
type PrizeCode = 'DB' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7';

interface DayXsmb {
  regionLabel: string;
  dateLabel: string;
  status: string;              // "Đang quay" | "Đã quay"
  currentPrize: PrizeCode;
  prizes: Record<PrizeCode, string[]>;
}

interface VietlottGame {
  name: string;
  code: string;
  result: string[];            // dãy số
  jackpot?: string;
}

interface DayVietlott {
  dateLabel: string;
  status: string;
  games: VietlottGame[];
}

@Component({
  selector: 'app-live-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-results.component.html',
  styleUrls: ['./live-results.component.scss'],
})
export class LiveResultsComponent implements OnInit, OnDestroy {

  readonly ORDER: PrizeCode[] = ['DB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];

  regions = [
    { key: 'XSMB' as RegionKey, label: 'XSMB — Miền Bắc' },
    { key: 'VIETLOTT' as RegionKey, label: 'VIETLOTT' },
  ];

  dayTabs = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  activeRegion: RegionKey = 'XSMB';
  activeDayIdx = 2;               // demo: Thứ Tư
  private liveXsmbIndex = 2;      // ngày đang quay (index trong tuần)

  xsmbWeek: DayXsmb[] = [];
  vietlottWeek: DayVietlott[] = [];

  headStats: { head: number; nums: string[] }[] = [];

  private spinTimer?: number;
  private spinningKeys = new Set<string>(); // "prize-index" cho XSMB live day

  constructor() {
    this.initDemoData();
  }

  // ===== lifecycle =====

  ngOnInit(): void {
    this.markSpinningForLiveXsmb();
    this.startSpinTimer();
    this.rebuildHeadStats();
  }

  ngOnDestroy(): void {
    if (this.spinTimer != null) {
      window.clearInterval(this.spinTimer);
    }
  }

  // ===== getters tiện dùng trong template =====

  get currentXsmb(): DayXsmb | null {
    if (this.activeRegion !== 'XSMB') return null;
    return this.xsmbWeek[this.activeDayIdx] ?? null;
  }

  get currentVietlott(): DayVietlott | null {
    if (this.activeRegion !== 'VIETLOTT') return null;
    return this.vietlottWeek[this.activeDayIdx] ?? null;
  }

  get isViewingLiveXsmb(): boolean {
    const cur = this.currentXsmb;
    return !!cur && cur.status === 'Đang quay';
  }

  // ===== event handlers =====

  setActiveRegion(region: RegionKey): void {
    if (this.activeRegion === region) return;
    this.activeRegion = region;
    this.rebuildHeadStats();
  }

  setActiveDay(idx: number): void {
    this.activeDayIdx = idx;
    this.rebuildHeadStats();
  }

  isSpinning(prize: PrizeCode, index: number): boolean {
    return this.spinningKeys.has(this.key(prize, index));
  }

  // ===== internal =====

  private initDemoData(): void {
    // Demo 7 ngày XSMB
    const baseXsmb: DayXsmb = {
      regionLabel: 'XSMB',
      dateLabel: 'Thứ Tư, 19/11/2025',
      status: 'Đang quay',
      currentPrize: 'G5',
      prizes: {
        DB: ['78555'],
        G1: ['91353'],
        G2: ['05930', '06646'],
        G3: ['84484', '85281', '28117', '47788', '04174', '75509'],
        G4: ['7699', '0835', '4175', '7378'],
        // 3 số đầu đã về, 3 số cuối đang quay (random)
        G5: ['4266', '2498', '9210', '0000', '0000', '0000'],
        // G6 & G7 đang quay toàn bộ
        G6: ['000', '000', '000'],
        G7: ['00', '00', '00', '00'],
      },
    };

    // clone base cho đủ 7 ngày, thay dateLabel + status
    const labels = [
      'Thứ Hai, 17/11/2025',
      'Thứ Ba, 18/11/2025',
      'Thứ Tư, 19/11/2025',
      'Thứ Năm, 20/11/2025',
      'Thứ Sáu, 21/11/2025',
      'Thứ Bảy, 22/11/2025',
      'Chủ Nhật, 23/11/2025',
    ];

    this.xsmbWeek = labels.map((lab, idx) => {
      if (idx === this.liveXsmbIndex) {
        return { ...baseXsmb, dateLabel: lab };
      }
      // các ngày khác: đã quay, dữ liệu cố định
      return {
        regionLabel: 'XSMB',
        dateLabel: lab,
        status: 'Đã quay',
        currentPrize: 'G7',
        prizes: {
          DB: ['27079'],
          G1: ['91353'],
          G2: ['05930', '06646'],
          G3: ['84484', '85281', '28117', '47788', '04174', '75509'],
          G4: ['7699', '0835', '4175', '7378'],
          G5: ['4266', '2498', '9210', '3795', '8653', '3860'],
          G6: ['184', '940', '675'],
          G7: ['60', '95', '65', '43'],
        },
      };
    });

    // Demo 7 ngày Vietlott
    const baseVietlottGames: VietlottGame[] = [
      {
        name: 'Power 6/55',
        code: 'PW655',
        result: ['05', '12', '23', '34', '45', '55'],
        jackpot: '88.000.000.000₫',
      },
      {
        name: 'Mega 6/45',
        code: 'MG645',
        result: ['03', '10', '16', '27', '31', '42'],
        jackpot: '18.000.000.000₫',
      },
    ];

    this.vietlottWeek = labels.map((lab, idx) => ({
      dateLabel: lab,
      status: idx === this.liveXsmbIndex ? 'Đang quay' : 'Đã quay',
      games: baseVietlottGames,
    }));
  }

  private markSpinningForLiveXsmb(): void {
    const liveDay = this.xsmbWeek[this.liveXsmbIndex];
    if (!liveDay) return;

    const add = (p: PrizeCode, idx: number) =>
      this.spinningKeys.add(this.key(p, idx));

    // G5: index 3..5
    add('G5', 3);
    add('G5', 4);
    add('G5', 5);
    // G6: 0..2
    add('G6', 0);
    add('G6', 1);
    add('G6', 2);
    // G7: 0..3
    add('G7', 0);
    add('G7', 1);
    add('G7', 2);
    add('G7', 3);
  }

  private key(prize: PrizeCode, index: number): string {
    return `${prize}-${index}`;
  }

  private randomDigits(len: number): string {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += Math.floor(Math.random() * 10);
    }
    return s;
  }

  private startSpinTimer(): void {
    this.spinTimer = window.setInterval(() => {
      const day = this.xsmbWeek[this.liveXsmbIndex];
      if (!day) return;

      this.spinningKeys.forEach((key) => {
        const [pr, iStr] = key.split('-') as [PrizeCode, string];
        const idx = +iStr;
        const arr = day.prizes[pr];
        if (!arr || idx >= arr.length) return;
        const len = arr[idx].length || 4;
        arr[idx] = this.randomDigits(len);
      });

      // nếu đang xem đúng XSMB thì cập nhật thống kê đầu luôn
      if (this.activeRegion === 'XSMB') {
        this.rebuildHeadStats();
      }
    }, 140);
  }

  private rebuildHeadStats(): void {
    if (this.activeRegion !== 'XSMB') {
      this.headStats = [];
      return;
    }
    const cur = this.currentXsmb;
    if (!cur) {
      this.headStats = [];
      return;
    }

    const heads: Record<number, string[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [],
      5: [], 6: [], 7: [], 8: [], 9: [],
    };

    const last2 = (s: string) => {
      const c = s.replace(/\D/g, '');
      if (!c) return '';
      return c.length >= 2 ? c.slice(-2) : c.padStart(2, '0');
    };

    this.ORDER.forEach((p) => {
      cur.prizes[p].forEach((n, idx) => {
        // bỏ các ô đang quay
        if (p !== 'DB' && this.isSpinning(p, idx)) return;
        const l2 = last2(n);
        if (!l2) return;
        const h = Number(l2[0]);
        heads[h].push(l2);
      });
    });

    this.headStats = Object.keys(heads).map((h) => ({
      head: Number(h),
      nums: heads[Number(h)].sort((a, b) => a.localeCompare(b)),
    }));
  }
}
