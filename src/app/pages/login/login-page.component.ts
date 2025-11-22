import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginPageComponent {

  username = '';
  password = '';
  error = '';

  readonly ADMIN_USER = 'admin';
  readonly ADMIN_PASS = '12345678aA@';

  loading = false;

  constructor(private router: Router) {}

  login(): void {
    this.error = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Vui lòng nhập đủ tài khoản và mật khẩu.';
      return;
    }

    this.loading = true;

    setTimeout(() => {
      this.loading = false;

      if (this.username === this.ADMIN_USER && this.password === this.ADMIN_PASS) {
        localStorage.setItem('admin_logged', 'true');
        this.router.navigate(['/admin/diem-mua-ve-so']);
      } else {
        this.error = 'Sai tài khoản hoặc mật khẩu.';
      }
    }, 400);
  }
}
