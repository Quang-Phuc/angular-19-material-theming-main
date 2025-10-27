import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import các module Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Output này sẽ "bắn" sự kiện ra cho AdminLayoutComponent
  @Output() sidenavToggle = new EventEmitter<void>();

  // Hàm được gọi khi click nút hamburger
  onToggleSidenav(): void {
    this.sidenavToggle.emit();
  }
}
