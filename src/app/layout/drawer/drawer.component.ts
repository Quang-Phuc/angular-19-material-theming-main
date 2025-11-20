import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';      // cần cho async pipe
import { RouterLink } from '@angular/router';
import { UiService } from '../../core/services/ui.service';

@Component({
  standalone: true,
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  imports: [CommonModule, RouterLink]
})
export class DrawerComponent {
  // Cho template dùng: (ui.drawer$ | async) và gọi hàm
  public ui = inject(UiService);

  close() {
    this.ui.closeDrawer();
  }
}
