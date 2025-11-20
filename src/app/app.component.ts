// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Nếu bạn đã tạo 2 component này ở dạng standalone:
import { HeaderComponent } from './layout/header/header.component';
import { ChatboxComponent } from './features/chatbox/chatbox.component';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, ChatboxComponent]
})
export class AppComponent {}
