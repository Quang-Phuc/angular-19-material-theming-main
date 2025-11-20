// src/app/layout/drawer/drawer.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  standalone: true,
  styleUrls: ['./drawer.component.scss']
})
export class DrawerComponent {
  constructor(public ui: UiService) {}

  close(){ this.ui.closeDrawer(); }
}
