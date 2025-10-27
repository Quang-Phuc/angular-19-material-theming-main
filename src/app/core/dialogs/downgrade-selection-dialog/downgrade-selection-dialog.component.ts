// downgrade-selection-dialog.component.ts (NEW FILE)

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; // <-- Import Checkbox
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

// import { StoreInfo, UserInfo, CurrentUsage } from '../../../../core/services/license.service'; // Adjust path
import { StoreInfo, UserInfo, CurrentUsage } from '../../services/license.service'; // Adjust path

// Data structure passed into the dialog
export interface DowngradeDialogData {
  newPackageLimits: { maxStore: number; maxUserPerStore: number };
  currentUsage: CurrentUsage;
}

@Component({
  selector: 'app-downgrade-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- Add
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule, // <-- Add
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './downgrade-selection-dialog.component.html',
  styleUrl: './downgrade-selection-dialog.component.scss'
})
export class DowngradeSelectionDialogComponent {

  selectedStoreIds: { [id: number]: boolean } = {};
  selectedUserIds: { [id: number]: boolean } = {};

  numSelectedStores = 0;
  numSelectedUsers = 0;

  constructor(
    public dialogRef: MatDialogRef<DowngradeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DowngradeDialogData
  ) {
    // Pre-select some if needed, or leave empty
  }

  onStoreSelectionChange(): void {
    this.numSelectedStores = Object.values(this.selectedStoreIds).filter(Boolean).length;
  }

  onUserSelectionChange(): void {
    this.numSelectedUsers = Object.values(this.selectedUserIds).filter(Boolean).length;
  }

  // Check if store selection limit is reached
  isStoreLimitReached(): boolean {
    return this.numSelectedStores >= this.data.newPackageLimits.maxStore;
  }

  // Check if user selection limit is reached
  isUserLimitReached(): boolean {
    return this.numSelectedUsers >= this.data.newPackageLimits.maxUserPerStore;
  }

  // Check if the confirmation button should be enabled
  canConfirm(): boolean {
    return this.numSelectedStores <= this.data.newPackageLimits.maxStore &&
      this.numSelectedUsers <= this.data.newPackageLimits.maxUserPerStore &&
      this.numSelectedStores > 0 && // Must select at least one store/user?
      this.numSelectedUsers > 0;
  }


  onCancel(): void {
    this.dialogRef.close(); // Close without returning data
  }

  onConfirm(): void {
    // Return the IDs of the selected items
    const storesToKeep = Object.keys(this.selectedStoreIds)
      .filter(id => this.selectedStoreIds[+id])
      .map(id => +id);
    const usersToKeep = Object.keys(this.selectedUserIds)
      .filter(id => this.selectedUserIds[+id])
      .map(id => +id);

    this.dialogRef.close({ storesToKeep, usersToKeep });
  }
}
