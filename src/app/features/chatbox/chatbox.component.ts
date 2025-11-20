// src/app/features/chatbox/chatbox.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-chatbox',
  template: `
    <div class="chatbox">
      <div class="log">
        <div *ngFor="let m of msgs" [class.me]="m.me">{{m.text}}</div>
      </div>
      <div class="input">
        <input [(ngModel)]="msg" (keyup.enter)="send()" placeholder="Nhập câu hỏi...">
        <button (click)="send()">Gửi</button>
      </div>
    </div>
  `,
  styles: [`.chatbox{position:fixed;right:12px;bottom:12px;width:320px;background:#111;border:1px solid #333;border-radius:10px}
  .log{max-height:220px;overflow:auto;padding:8px}
  .me{text-align:right}
  .input{display:flex;gap:6px;padding:8px}`],
  imports: [FormsModule]
})
export class ChatboxComponent {
  msg = ''; msgs = [{text:'Xin chào! (demo)', me:false}];
  send(){ const t=this.msg.trim(); if(!t) return; this.msgs.push({text:t,me:true}); this.msg=''; }
}
