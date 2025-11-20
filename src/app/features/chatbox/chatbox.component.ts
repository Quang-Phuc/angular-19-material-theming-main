import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiService } from '../../core/services/ui.service';

@Component({
  standalone: true,
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ChatboxComponent {
  public ui = inject(UiService);

  msg = '';
  msgs = [
    { text: 'Xin chào! Em là Thần Đèn AI 👋 (demo)', me: false },
    { text: 'Hỏi em về giấc mơ / thống kê / soi cầu…', me: false }
  ];

  send(){
    const t = this.msg.trim(); if(!t) return;
    this.msgs.push({ text: t, me: true });
    this.msg = '';
    setTimeout(() => this.msgs.push({ text: `Demo: nhận "${t}".`, me: false }), 300);
  }
}
