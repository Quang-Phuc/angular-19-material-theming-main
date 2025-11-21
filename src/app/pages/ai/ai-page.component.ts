import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AiPlan {
  id: number;
  code: string;
  title: string;
  heroName: string;
  heroSubtitle: string;
  priceLabel: string;
  oldPriceLabel?: string;
  highlightLine: string;
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
      title: 'Gói 1 • Siêu Cơ Bản',
      heroName: 'GIA CÁT LƯỢNG',
      heroSubtitle: 'Siêu Máy Tính AI',
      priceLabel: '0đ',
      highlightLine: 'Xem FREE 1 lần mỗi ngày',
      highlightSub: 'Chỉ cần xem ~3s quảng cáo để mở khoá',
      isFree: true,
      perks: [
        'Dự đoán bởi AI GPT-5.1 phiên bản mới nhất',
        'Phân tích dữ liệu 90 kỳ gần nhất (3 tháng)',
        'Gợi ý 2 số sáng nhất giải đặc biệt',
        'Gợi ý thêm 2 số “ăn theo” ở các giải khác',
        'Chỉ số niềm tin AI (Confidence Index ≥ 63%)',
        'Mở khoá trong 1 chạm – không cần đăng ký'
      ],
      note: 'Phù hợp để thử nghiệm cảm giác “soi số bằng AI” mà chưa cần bỏ tiền.'
    },
    {
      id: 2,
      code: 'G2',
      title: 'Gói 2 • Albert Einstein',
      heroName: 'ALBERT EINSTEIN',
      heroSubtitle: 'Thiên tài giải mã số học',
      priceLabel: '50.000đ',
      oldPriceLabel: '100.000đ',
      highlightLine: 'Ưu đãi đặc biệt: 50.000đ / lần',
      highlightSub: 'Phân tích sâu cho 1 lần cầu chuẩn',
      isFree: false,
      perks: [
        'Phân tích AI kép: GPT-5.1 + Gemini Advanced',
        'Dữ liệu 200 ngày gần nhất',
        'Gợi ý 2 số sáng nhất G.DB + 3 số giải khác',
        'Chỉ số niềm tin AI (Confidence Index ≥ 80%)',
        'Giải thích logic rõ ràng kèm nhận xét chu kỳ',
        'Loại nhiễu – ưu tiên các đường kèo mạnh'
      ],
      note: 'Sau khi chuyển khoản, bạn nhận mã code kích hoạt G2 qua Zalo / SMS để xem dự đoán.'
    },
    {
      id: 3,
      code: 'G3',
      title: 'Gói 3 • VIP Chuyên Sâu',
      heroName: 'NHÓM CHUYÊN GIA ELITE',
      heroSubtitle: 'AI + Mô hình nâng cao',
      priceLabel: '199.000đ',
      oldPriceLabel: '299.000đ',
      highlightLine: 'Gói VIP – mở khoá 7 ngày dùng liên tục',
      highlightSub: 'Dành cho người chơi nghiêm túc',
      isFree: false,
      perks: [
        'Kết hợp 3 mô hình AI: GPT-5.1, Gemini Advanced, Claude-Next',
        'Phân tích 365 kỳ + chu kỳ theo tuần / tháng',
        'Gợi ý combo: đề, lô, xiên 2 với chiến lược vốn',
        'Bảng sức mạnh từng số (0–99) và điểm rủi ro',
        'Ưu tiên xử lý nhanh, hạn chế giới hạn lượt dùng',
        'Tương lai có thể nhận báo cáo PDF hoặc gửi qua Zalo / Email'
      ],
      note: 'Có thể bán theo tuần (7 ngày), chi tiết xử lý ở backend / trang quản lý mã code.'
    }
  ];

  // Bật popup bảng giá NGAY khi vào trang
  showPricingModal = true;

  // popup chi tiết gói
  showDetailModal = false;
  selectedPlan: AiPlan | null = null;

  expandedPlan = new Set<number>();

  codeInput = '';
  activationMsg = '';
  activating = false;

  readonly bankInfo = {
    bankName: 'Ngân hàng ABC',
    owner: 'NGUYEN VAN A',
    number: '0123 456 789',
    contentHint: 'SĐT + GÓI (VD: 0989xxxxxx G2)'
  };

  // vẫn giữ để sau này gọi từ chỗ khác nếu cần
  openPricing(): void {
    this.showPricingModal = true;
  }

  closePricing(): void {
    this.showPricingModal = false;
  }

  toggleExpand(plan: AiPlan, event: MouseEvent): void {
    event.stopPropagation();
    if (this.expandedPlan.has(plan.id)) {
      this.expandedPlan.delete(plan.id);
    } else {
      this.expandedPlan.add(plan.id);
    }
  }

  openPlanDetail(plan: AiPlan, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    this.selectedPlan = plan;
    this.codeInput = '';
    this.activationMsg = plan.isFree
      ? 'Gói FREE: giai đoạn demo chưa gắn quảng cáo, bạn có thể bấm "Xem dự đoán ngay" để gọi API AI trực tiếp.'
      : '';
    this.showPricingModal = false;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
  }

  activateWithCode(): void {
    if (!this.selectedPlan || this.selectedPlan.isFree) {
      return;
    }
    if (!this.codeInput.trim()) {
      this.activationMsg = 'Vui lòng nhập mã code kích hoạt.';
      return;
    }

    this.activating = true;
    this.activationMsg = '';

    setTimeout(() => {
      this.activating = false;
      this.activationMsg =
        `✅ Mã code hợp lệ. Gói ${this.selectedPlan?.code} đã được mở khoá, bạn có thể xem dự đoán AI.`;
    }, 800);
  }

  viewPrediction(): void {
    if (!this.selectedPlan) { return; }

    if (this.selectedPlan.isFree) {
      this.activationMsg =
        'Demo: sẽ gọi API dự đoán AI cho gói FREE (chưa tích hợp quảng cáo).';
    } else {
      this.activationMsg =
        'Sau khi mã code kích hoạt hợp lệ, frontend sẽ chuyển sang màn hình kết quả soi cầu AI.';
    }
  }
}
