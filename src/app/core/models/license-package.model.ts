// src/app/core/models/license-package.model.ts (TỆP MỚI)

// Dựa trên Java entity
export interface LicensePackage {
  id: number;
  name: string;
  description?: string;
  maxStore?: number;
  maxUserPerStore?: number;
  price: number;
  discount?: number;
  durationDays?: number;

  // Thêm các trường auditable nếu cần
  // createdDate?: Date;
  // lastModifiedDate?: Date;
}

// Interface cho API response (nếu có)
// Tạm thời giả định API trả về mảng LicensePackage[]
