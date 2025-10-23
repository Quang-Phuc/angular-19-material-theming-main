import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Common ErrorStateMatcher:
 * Chỉ hiển thị lỗi khi control bị invalid VÀ (đã dirty HOẶC đã submit).
 */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    // Lấy logic từ file register.component.ts của bạn
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}
