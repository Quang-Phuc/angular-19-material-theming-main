// src/app/layout/header/header.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-header',
  template: `
    <header class="header">
      <nav>
        <a routerLink="/">Trang chủ</a> |
        <a routerLink="/phong-thuy">Phong Thuỷ</a> |
        <a routerLink="/ai">AI</a> |
        <a routerLink="/giac-mo">Giấc mơ</a> |
        <a routerLink="/vietlott">Vietlott</a>
      </nav>
    </header>
  `,
  styles: [`.header{padding:10px;border-bottom:1px solid #333}`],
  imports: [RouterLink]
})
export class HeaderComponent {}
