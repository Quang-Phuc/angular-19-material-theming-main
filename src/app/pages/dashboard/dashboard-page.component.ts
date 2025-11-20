// src/app/pages/dashboard/dashboard-page.component.ts
import { Component } from '@angular/core';
// import { LiveResultsComponent } from '../../features/live-results/live-results.component';
import { HeadsTableComponent } from '../../features/heads-table/heads-table.component';
import { PastDaysComponent } from '../../features/past-days/past-days.component';
import {LiveResultsComponent} from '../../features/live-results/ live-results.component';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [LiveResultsComponent, HeadsTableComponent, PastDaysComponent]
})
export class DashboardPageComponent {}
