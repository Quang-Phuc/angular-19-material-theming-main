// src/app/pages/ai/ai-page.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AiPlan {
  id: number;
  code: string;          // G1 / G2 / G3
  title: string;         // GÓI 1
  heroName: string;      // GIA CÁT LƯỢNG, EINSTEIN...
  heroSubtitle: string;
  priceLabel: string;    // "Giá: 0đ" hoặc "50.000đ"
  oldPriceLabel?: string;
  highlightLine: string; // dòng đỏ to
  highlightSub?: string;
  perks: string[];
  note?: string;
  isFree: boolean;
}

@Component({
  standalone: true,
  selector: 'app-ai-page',
  templateUrl: './ai-page.component.html',
  styleUrls: ['./ai-page.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AiPageComponent {

  plans: AiPlan[] = [
    {
      id: 1,
      code: 'G1',
      title: 'GÓI 1',
      heroName: 'GIA CÁT LƯỢNG',
      heroSubtitle: 'Siêu Máy Tính AI',
      priceLabel: 'Giá: 0đ',
      highlightLine: 'Chỉ cần xem 3 giây quảng cáo là dùng ngay',
      highlightSub: '(Mỗi ngày chỉ được soi FREE 1 lần)',
      isFree: true,
      perks: [
        'Dự đoán bởi AI GPT-5.1 phiên bản mới nhất',
        'Phân tích dữ liệu 90 kỳ gần nhất (3 tháng)',
        'Gợi ý 2 số sáng nhất giải đặc biệt + 2 số giải khác (2 số cuối của mỗi giải)',
        'Chỉ số niềm tin AI (Confidence Index ≥ 63%)',
        'Mở khoá trong 1 chạm – không cần đăng ký'
      ],
      note: 'Xem một đoạn quảng cáo Shopee / YouTube ~3–5s để mở khoá lượt soi miễn phí ngày hôm nay.'
    },
    {
      id: 2,
      code: 'G2',
      title: 'GÓI 2',
      heroName: 'ALBERT EINSTEIN',
      heroSubtitle: 'Thiên tài giải mã số học',
      priceLabel: '50.000đ',
      oldPriceLabel: '100.000đ',
      highlightLine: 'Ưu đãi đặc biệt: 50.000đ / lần mở khoá',
      highlightSub: 'Mua một lần – mở khoá cấp độ tối thượng',
      isFree: false,
      perks: [
        'Phân tích AI kép: GPT-5.1 + Gemini Advanced',
        'Dữ liệu 200 ngày gần nhất',
        'Gợi ý 2 số sáng nhất giải đặc biệt + 3 số giải khác (2 số cuối của mỗi giải)',
        'Chỉ số niềm tin AI (Confidence Index ≥ 80%)',
        'Giải thích logic rõ ràng, dễ hiểu',
        'Loại nhiễu – giữ lại những chu kỳ mạnh'
      ],
      note: 'Sau khi chuyển khoản, bạn sẽ nhận được 01 mã code kích hoạt gửi qua Zalo / SMS để xem dự đoán ngay.'
    },
    {
      id: 3,
      code: 'G3',
      title: 'GÓI 3',
      heroName: 'NHÓM CHUYÊN GIA ELITE',
      heroSubtitle: 'AI + Mô hình nâng cao',
      priceLabel: '199.000đ',
      oldPriceLabel: '299.000đ',
      highlightLine: 'Gói VIP – dành cho người chơi nghiêm túc',
      highlightSub: 'Mở khoá 7 ngày dùng liên tục',
      isFree: false,
      perks: [
        'Kết hợp 3 mô hình AI: GPT-5.1, Gemini Advanced, Claude-Next',
        'Phân tích sâu 365 kỳ gần nhất + chu kỳ theo tuần / tháng',
        'Gợi ý combo: đề, lô, xiên 2 – theo chiến lược vốn an toàn',
        'Bảng sức mạnh từng số (0–99) và điểm rủi ro',
        'Ưu tiên xử lý nhanh, hạn chế giới hạn lượt sử dụng',
        'Nhận báo cáo PDF ngắn gọn (tương lai có thể gửi qua Zalo / Email)'
      ],
      note: 'Gói VIP có thể bán theo tuần, bạn tự quy định thêm điều kiện sử dụng ở phần backend.'
    }
  ];

  selectedPlan: AiPlan | null = null;
  showModal = false;

  // bước nhập code
  codeInput = '';
  activationMsg = '';
  activating = false;

  // thông tin demo tài khoản ngân hàng
  readonly bankInfo = {
    bankName: 'Ngân hàng ABC',
    owner: 'NGUYEN VAN A',
    number: '0123 456 789',
    contentHint: 'SĐT + GÓI (VD: 0989xxxxxx G2)',
  };

  openPlan(plan: AiPlan): void {
    this.selectedPlan = plan;
    this.activationMsg = '';
    this.codeInput = '';
    this.showModal = true;

    // với gói free: ở giai đoạn đầu có thể chỉ show hướng dẫn xem quảng cáo
    if (plan.isFree) {
      this.activationMsg =
        'Gói Free: bạn sẽ được mở khoá 1 lần / ngày sau khi xem quảng cáo. ' +
        'Giai đoạn demo: bấm Xem Dự Đoán Ngay để gọi API AI trực tiếp.';
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  /**
   * Giả lập việc gửi mã code lên backend để kích hoạt.
   * Sau này bạn chỉ cần thay phần này bằng HTTP call thực.
   */
  activateWithCode(): void {
    if (!this.codeInput.trim()) {
      this.activationMsg = 'Vui lòng nhập mã code kích hoạt.';
      return;
    }
    this.activating = true;
    this.activationMsg = '';

    // demo: giả lập gọi backend trong 800ms
    setTimeout(() => {
      this.activating = false;
      // Ở bản thật, kiểm tra response từ server
      // ví dụ: if (res.valid) ...
      this.activationMsg =
        '✅ Mã code hợp lệ. Gói ' +
        (this.selectedPlan?.code || '') +
        ' đã được mở khoá, bạn có thể gọi API soi cầu AI.';
    }, 800);
  }

  // click "Xem dự đoán ngay" – ở đây chỉ demo
  viewPrediction(): void {
    if (this.selectedPlan?.isFree) {
      this.activationMsg =
        'Demo Free: sẽ gọi API dự đoán AI ngay lập tức (chưa tích hợp quảng cáo).';
    } else {
      this.activationMsg =
        'Sau khi mã code được kích hoạt thành công, frontend sẽ chuyển sang màn hình kết quả soi cầu AI.';
    }
  }
}
