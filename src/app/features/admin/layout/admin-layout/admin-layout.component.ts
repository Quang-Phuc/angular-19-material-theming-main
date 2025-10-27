import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Import RouterModule
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Import 3 component riêng lẻ
import { HeaderComponent } from '../../components/header/header.component';
import { SidenavComponent } from '../../components/sidenav/sidenav.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // <-- Thêm vào
    MatSidenavModule,
    MatProgressSpinnerModule,
    HeaderComponent, // <-- Component riêng
    SidenavComponent, // <-- Component riêng
    FooterComponent  // <-- Component riêng
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  // Dùng ViewChild để điều khiển Sidenav
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Biến cờ cho Sidenav
  isSidenavOpen = true;

  /**
   * Hàm này được gọi từ HeaderComponent (qua @Output)
   * để đóng/mở Sidenav
   */
  onToggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
    this.sidenav.toggle();
  }
}
