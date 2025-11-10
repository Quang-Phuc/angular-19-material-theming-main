import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

const MODULES = [
  MatToolbarModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule,
  MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatProgressBarModule,
  MatTableModule, MatPaginatorModule, MatSortModule, MatSnackBarModule, MatDialogModule, MatBadgeModule,
  MatCheckboxModule, MatRadioModule, MatSlideToggleModule
];

@NgModule({
  imports: MODULES,
  exports: MODULES
})
export class AppMaterialModule {}
