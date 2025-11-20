import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

type PrizeCode = 'DB' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7';

interface LiveState {
  regionLabel: string;              // XSMB
  dateLabel: string;                // Thứ Tư, 19/11/2025
  status: string;                   // Đang quay / Đã quay
  currentPrize: PrizeCode;
  prizes: Record<PrizeCode, string[]>;
}

@Component({
  selector: 'app-live-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-results.component.html',
  styleUrls: ['./live-results.component.css'],
})
export class LiveResultsComponent implements OnInit, OnDestroy {
  readonly ORDER: PrizeCode[] = ['DB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];

  dayTabs = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  activeDayIdx = 2; // demo: Thứ Tư

  live: LiveState;
  past: LiveState[];
  headStats: { head: number; nums: string[] }[] = [];

  private revealQueue: { prize: PrizeCode; index: number; value: string }[] = [];
  private spinningKeys = new Set<string>();   // prize-index đang quay
  private revealTimer?: number;
  private spinTimer?: number;

  constructor() {
    // ===== Hôm nay (demo) =====
    this.live = {
      regionLabel: 'XSMB',
      dateLabel: 'Thứ Tư, 19/11/2025',
      status: 'Đang quay',
      currentPrize: 'G5',
      prizes: {
        DB: ['78555'],
        G1: ['02743'],
        G2: ['81234', '90321'],
        G3: ['34812', '57290', '00213', '99120', '44113', '77002'],
        G4: ['6032', '9182', '5578', '1290'],
        // 3 số đầu G5 đã về, 3 số sau đang quay
        G5: ['7453', '2231', '9910', '0000', '0000', '0000'],
        // G6, G7 đang quay hết
        G6: ['000', '000', '000'],
        G7: ['00', '00', '00', '00'],
      },
    };

    // ===== 4 ngày trước (demo) =====
    this.past = [
      {
        regionLabel: 'XSMB',
        dateLabel: 'Thứ Ba, 18/11/2025',
        status: 'Đã quay',
        currentPrize: 'G7',
        prizes: {
          DB: ['68295'],
          G1: ['02743'],
          G2: ['81234', '90321'],
          G3: ['34812', '57290', '00213', '99120', '44113', '77002'],
          G4: ['6032', '9182', '5578', '1290'],
          G5: ['7453', '2231', '9910', '5501', '7723', '1382'],
          G6: ['783', '031', '690'],
          G7: ['28', '13', '55', '09'],
        },
      },
      {
        regionLabel: 'XSMB',
        dateLabel: 'Thứ Hai, 17/11/2025',
        status: 'Đã quay',
        currentPrize: 'G7',
        prizes: {
          DB: ['77102'],
          G1: ['34688'],
          G2: ['44021', '12890'],
          G3: ['11345', '90311', '44822', '77120', '99001', '22057'],
          G4: ['7788', '1102', '5690', '4421'],
          G5: ['7721', '5513', '0022', '1901', '7123', '3382'],
          G6: ['521', '765', '310'],
          G7: ['17', '44', '68', '12'],
        },
      },
      {
        regionLabel: 'XSMB',
        dateLabel: 'Chủ Nhật, 16/11/2025',
        status: 'Đã quay',
        currentPrize: 'G7',
        prizes: {
          DB: ['44550'],
          G1: ['11823'],
          G2: ['22311', '90022'],
          G3: ['77812', '11290', '00813', '99120', '44143', '77008'],
          G4: ['6039', '9184', '5571', '1299'],
          G5: ['7451', '2235', '9914', '5507', '7729', '1380'],
          G6: ['783', '037', '620'],
          G7: ['27', '39', '56', '04'],
        },
      },
      {
        regionLabel: 'XSMB',
        dateLabel: 'Thứ Bảy, 15/11/2025',
        status: 'Đã quay',
        currentPrize: 'G7',
        prizes: {
          DB: ['55123'],
          G1: ['99182'],
          G2: ['22011', '77890'],
          G3: ['11812', '55090', '44013', '77210', '66143', '33008'],
          G4: ['7039', '1184', '5574', '1297'],
          G5: ['3151', '2285', '9912', '5517', '7721', '1388'],
          G6: ['783', '947', '620'],
          G7: ['07', '19', '66', '84'],
        },
      },
    ];

    // Queue các số sẽ lần lượt "về"
    this.revealQueue = [
      { prize: 'G5', index: 3, value: '5501' },
      { prize: 'G5', index: 4, value: '7723' },
      { prize: 'G5', index: 5, value: '1382' },
      { prize: 'G6', index: 0, value: '783' },
      { prize: 'G6', index: 1, value: '031' },
      { prize: 'G6', index: 2, value: '690' },
      { prize: 'G7', index: 0, value: '28' },
      { prize: 'G7', index: 1, value: '13' },
      { prize: 'G7', index: 2, value: '55' },
      { prize: 'G7', index: 3, value: '09' },
    ];

    // Những ô đang quay (chạy 00–99)
    [
      ['G5', 3], ['G5', 4], ['G5', 5],
      ['G6', 0], ['G6', 1], ['G6', 2],
      ['G7', 0], ['G7', 1], ['G7', 2], ['G7', 3],
    ].forEach(([p, i]) => this.spinningKeys.add(this.key(p as PrizeCode, i as number)));
  }

  ngOnInit(): void {
    this.rebuildHeadStats();
    this.startSpinTimer();
    this.startRevealTimer();
  }

  ngOnDestroy(): void {
    if (this.revealTimer != null) {
      window.clearInterval(this.revealTimer);
    }
    if (this.spinTimer != null) {
      window.clearInterval(this.spinTimer);
    }
  }

  setActiveDay(idx: number): void {
    this.activeDayIdx = idx;
    // Sau này bạn có thể call API theo ngày này
  }

  /** Tách chuỗi thành các cặp 2 số để render lô tô */
  chunk2(str: string): string[] {
    const out: string[] = [];
    if (!str) return out;
    const s = String(str);
    for (let i = 0; i < s.length; i += 2) {
      out.push(s.slice(i, i + 2));
    }
    return out;
  }

  /** Dùng trong template: ô nào đang quay thì thêm hiệu ứng */
  isSpinning(prize: string, index: number): boolean {
    return this.spinningKeys.has(this.key(prize as PrizeCode, index));
  }

  // ===== INTERNAL =====

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

  /** Timer quay số (random 00–99/000/0000…) cho các ô đang quay */
  private startSpinTimer(): void {
    this.spinTimer = window.setInterval(() => {
      this.spinningKeys.forEach((key) => {
        const [prize, idxStr] = key.split('-') as [PrizeCode, string];
        const idx = +idxStr;
        const arr = this.live.prizes[prize];
        if (!arr || idx >= arr.length) return;

        const len = arr[idx].length || 4;
        arr[idx] = this.randomDigits(len);
      });
    }, 120);
  }

  /** Timer lần lượt “chốt” từng số trong queue */
  private startRevealTimer(): void {
    this.revealTimer = window.setInterval(() => {
      if (!this.revealQueue.length) {
        window.clearInterval(this.revealTimer!);
        this.revealTimer = undefined;
        this.spinningKeys.clear();
        this.live.currentPrize = 'G7';
        this.live.status = 'Đã quay xong';
        this.rebuildHeadStats();
        return;
      }
      const step = this.revealQueue.shift()!;
      this.live.currentPrize = step.prize;
      this.live.prizes[step.prize][step.index] = step.value;
      this.spinningKeys.delete(this.key(step.prize, step.index));
      this.rebuildHeadStats();
    }, 1700);
  }

  /** Thống kê đầu số theo kết quả đã về (bỏ qua các ô còn đang quay) */
  private rebuildHeadStats(): void {
    const heads: Record<number, string[]> = {0: [],1: [],2: [],3: [],4: [],5: [],6: [],7: [],8: [],9: []};

    const clean = (s: string) => s.replace(/\D/g, '');
    const last2 = (s: string) => {
      const c = clean(s);
      if (!c) return '';
      return c.length >= 2 ? c.slice(-2) : c.padStart(2, '0');
    };

    this.ORDER.forEach((p) => {
      this.live.prizes[p].forEach((n, idx) => {
        if (this.isSpinning(p, idx)) return; // chưa chốt thì bỏ ra
        const l2 = last2(n);
        if (!l2) return;
        const head = Number(l2[0]);
        heads[head].push(l2);
      });
    });

    this.headStats = Object.keys(heads).map((h) => ({
      head: Number(h),
      nums: heads[Number(h)].sort((a, b) => a.localeCompare(b)),
    }));
  }
}
