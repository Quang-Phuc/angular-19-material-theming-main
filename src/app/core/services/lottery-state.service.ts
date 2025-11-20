// src/app/core/services/lottery-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, take } from 'rxjs';
import { DayResult, LiveState, PrizeKey } from '../models/lottery.models';

@Injectable({ providedIn: 'root' })
export class LotteryStateService {
  // dữ liệu demo (cắm API thật thì thay ở đây)
  readonly ORDER: PrizeKey[] = ['DB','G1','G2','G3','G4','G5','G6','G7'];

  live$ = new BehaviorSubject<LiveState>({
    currentPrize: 'G5',
    prizes: {
      DB:['78555'], G1:['02743'], G2:['81234','90321'],
      G3:['34812','57290','00213','99120','44113','77002'],
      G4:['6032','9182','5578','1290'],
      G5:['7453','2231','9910','— —','— —','— —'],
      G6:['•••','•••','•••'],
      G7:['••','••','••','••']
    }
  });

  day1: DayResult = { /* hôm qua */ prizes: {
      DB:['68295'], G1:['02743'], G2:['81234','90321'],
      G3:['34812','57290','00213','99120','44113','77002'],
      G4:['6032','9182','5578','1290'],
      G5:['7453','2231','9910','5501','7723','1382'],
      G6:['783','031','690'], G7:['28','13','55','09']
    }};
  day2: DayResult = { /* -2 ngày */ prizes: {
      DB:['77102'], G1:['34688'], G2:['44021','12890'],
      G3:['11345','90311','44822','77120','99001','22057'],
      G4:['7788','1102','5690','4421'],
      G5:['7721','5513','0022','1901','7123','3382'],
      G6:['521','765','310'], G7:['17','44','68','12']
    }};
  day3: DayResult = { /* -3 ngày */ prizes: {
      DB:['44550'], G1:['11823'], G2:['22311','90022'],
      G3:['77812','11290','00813','99120','44143','77008'],
      G4:['6039','9184','5571','1299'],
      G5:['7451','2235','9914','5507','7729','1380'],
      G6:['783','037','620'], G7:['27','39','56','04']
    }};

  // hàng đợi “đang quay”
  private queue = [
    {prize:'G5' as PrizeKey, index:3, value:'5501'},
    {prize:'G5' as PrizeKey, index:4, value:'7723'},
    {prize:'G5' as PrizeKey, index:5, value:'1382'},
    {prize:'G6' as PrizeKey, index:0, value:'783'},
    {prize:'G6' as PrizeKey, index:1, value:'031'},
    {prize:'G6' as PrizeKey, index:2, value:'690'},
    {prize:'G7' as PrizeKey, index:0, value:'28'},
    {prize:'G7' as PrizeKey, index:1, value:'13'},
    {prize:'G7' as PrizeKey, index:2, value:'55'},
    {prize:'G7' as PrizeKey, index:3, value:'09'}
  ];

  startAutoReveal() {
    interval(1600).pipe(take(this.queue.length)).subscribe(() => this.revealNext());
  }

  private revealNext() {
    const step = this.queue.shift(); if (!step) return;
    const snap = structuredClone(this.live$.value) as LiveState;
    snap.currentPrize = step.prize;
    snap.prizes[step.prize][step.index] = step.value;
    this.live$.next(snap);
  }

  // tiện ích thống kê đầu số
  calcHeads(prizes: DayResult['prizes']) {
    const heads: Record<number,string[]> = {0:[],1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]};
    const last2 = (s:string)=> s.replace(/\s/g,'').slice(-2).padStart(2,'0');
    this.ORDER.forEach(k =>
      prizes[k].forEach(s=>{
        if (s.includes('•') || s.includes('—')) return;
        const l2 = last2(s); heads[+l2[0]].push(l2);
      })
    );
    return heads;
  }
}
