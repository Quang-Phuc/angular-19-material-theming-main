import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import * as AOS from 'aos';

// Import các module Material cần thiết
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs'; // Dùng cho phần nghiệp vụ

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule
  ]
})
export class HomepageComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Form cho phần "Hãy để chúng tôi đồng hành" (Giống KiotViet)
  consultForm = this.fb.group({
    phone: [null, Validators.required],
    name: [null],
  });

  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }

  // === DỮ LIỆU CẤU TRÚC GIỐNG KIOTVIET ===

  // 1. Giá trị cốt lõi (Đơn giản, Tiết kiệm, Phù hợp...)
  valueProps = [
    {
      icon: 'devices',
      title: 'Đơn giản & Dễ sử dụng',
      description: 'Giao diện thân thiện, chỉ mất 15 phút làm quen, dùng trên mọi thiết bị.'
    },
    {
      icon: 'security',
      title: 'An toàn & Bảo mật',
      description: 'Mã hóa dữ liệu nhiều lớp, phân quyền nhân viên chi tiết, chống thất thoát.'
    },
    {
      icon: 'savings',
      title: 'Tiết kiệm chi phí',
      description: 'Miễn phí cài đặt, nâng cấp. Quản lý hiệu quả, giảm chi phí vận hành.'
    }
  ];

  // 2. Các nghiệp vụ hỗ trợ (Giống "Ngành hàng" của KiotViet)
  // Lấy từ file ảnh đầu tiên bạn gửi
  pawnServices = [
    { icon: 'store', name: 'Cầm đồ' },
    { icon: 'credit_card', name: 'Tín chấp' },
    { icon: 'percent', name: 'Trả góp' },
    { icon: 'shopping_bag', name: 'Bán hàng trả góp' },
    { icon: 'account_balance', name: 'Quản lý Vay' },
    { icon: 'gavel', name: 'Thanh lý tài sản' }
  ];

  // 3. Giải pháp toàn diện (Giống "KiotViet - Giải pháp kinh doanh...")
  coreSolutions = [
    {
      icon: 'check_circle',
      text: 'Quản lý Hợp đồng & Khách hàng (CRM) thông minh.'
    },
    {
      icon: 'check_circle',
      text: 'Quản lý Tài chính & Dòng tiền chi tiết, minh bạch.'
    },
    {
      icon: 'check_circle',
      text: 'Quản lý Tài sản, Kho bãi bằng mã vạch/QR code.'
    },
    {
      icon: 'check_circle',
      text: 'Quản lý Nhân viên & Chuỗi cửa hàng tập trung.'
    }
  ];

  // 4. Giải pháp Online (Giống "Giải pháp Bán hàng online...")
  onlineSolutions = [
    {
      icon: 'smartphone',
      title: 'App Mobile dành cho chủ tiệm',
      description: 'Quản lý mọi hoạt động của tiệm ngay trên điện thoại, mọi lúc mọi nơi. Nhận thông báo biến động tức thì.'
    },
    {
      icon: 'sms',
      title: 'Tự động nhắc nợ qua Zalo/SMS',
      description: 'Tự động gửi tin nhắn nhắc nợ khách hàng khi đến hạn, giảm nợ xấu, thu hồi vốn nhanh. Tùy chỉnh nội dung tin nhắn.'
    },
    {
      icon: 'warning',
      title: 'Quản lý Nợ xấu & Lịch sử tín dụng',
      description: 'Lưu trữ lịch sử giao dịch của khách hàng, tự động cảnh báo khi khách hàng nằm trong "danh sách đen".'
    }
  ];

  // 5. Khách hàng (Giống "Khách hàng của chúng tôi")
  testimonials = [
    {
      image: 'https://via.placeholder.com/350x200?text=Cầm+Đồ+Minh+Long',
      name: 'Cầm Đồ Minh Long',
      quote: 'Từ khi dùng phần mềm, tôi quản lý được kho hàng chặt chẽ, không còn lo thất thoát tài sản của khách nữa.'
    },
    {
      image: 'https://via.placeholder.com/350x200?text=Tín+Dụng+F888',
      name: 'F888 - Chi nhánh Cầu Giấy',
      quote: 'Tính năng quản lý chuỗi giúp tôi xem báo cáo của tất cả các phòng giao dịch ngay lập tức. Rất tiện lợi.'
    },
    {
      image: 'https://via.placeholder.com/350x200?text=Vay+Vốn+Nhanh+247',
      name: 'Vay Vốn Nhanh 247',
      quote: 'App mobile rất mượt. Tôi đi công tác vẫn duyệt được hợp đồng cho vay, nhân viên ở nhà chỉ việc giải ngân.'
    }
  ];

  // 6. Tin tức (Giống "Tin tức nổi bật")
  newsItems = [
    {
      image: 'https://via.placeholder.com/350x200?text=Tin+Tức+1',
      title: 'Cập nhật: Tính năng định giá Vàng 9999 theo thời gian thực',
      date: '23/10/2025'
    },
    {
      image: 'https://via.placeholder.com/350x200?text=Tin+Tức+2',
      title: '5 cách nhận biết xe máy "giả mạo" khi nhận cầm cố',
      date: '22/10/2025'
    },
    {
      image: 'https://via.placeholder.com/350x200?text=Tin+Tức+3',
      title: 'Thông báo: Quy trình quản lý nợ xấu mới theo Nghị định 70',
      date: '21/10/2025'
    }
  ];


  onConsultSubmit(): void {
    if (this.consultForm.valid) {
      alert('Đăng ký tư vấn thành công! Chúng tôi sẽ gọi lại cho bạn.');
      console.log(this.consultForm.value);
    }
  }
}
