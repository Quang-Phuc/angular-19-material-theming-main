import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroupDirective, NgForm, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as AOS from 'aos';
import { ErrorStateMatcher } from '@angular/material/core';

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

// Class ErrorStateMatcher (Giữ nguyên)
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Đảm bảo các biến này là public (không có từ khóa 'private')
  registerForm = this.fb.group({
    storeName: [null, Validators.required],
    phone: [null, [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  });

  matcher = new MyErrorStateMatcher();

  // *** THÊM 3 GETTERS NÀY VÀO ***
  get storeName() {
    return this.registerForm.get('storeName') as FormControl;
  }

  get phone() {
    return this.registerForm.get('phone') as FormControl;
  }

  get password() {
    return this.registerForm.get('password') as FormControl;
  }
  // *******************************

  ngOnInit(): void {
    AOS.init({
      duration: 800,
      once: true,
      offset: 0,
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Đăng ký với:', this.registerForm.value);
      alert('Đăng ký dùng thử thành công!');
    }
  }
}
