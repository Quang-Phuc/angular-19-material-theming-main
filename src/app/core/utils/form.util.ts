import { AbstractControl, FormGroup } from '@angular/forms';

export function markAllTouched(control: AbstractControl): void {
  control.markAsTouched();
  if ((control as any).controls) {
    const controls = (control as any).controls;
    Object.keys(controls).forEach(k => markAllTouched(controls[k]));
  }
}

export function patchIfPresent<T extends FormGroup>(form: T, value?: any): void {
  if (!value) return;
  form.patchValue(value);
}

export function getDirtyPayload<T extends FormGroup>(form: T): any {
  const result: any = {};
  Object.keys(form.controls).forEach(k => {
    const c = form.controls[k];
    if (c.dirty) result[k] = c.value;
  });
  return result;
}
