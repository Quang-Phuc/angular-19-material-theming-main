/**
 * Định nghĩa cấu trúc dữ liệu cho đối tượng Người dùng (User).
 * Đây là dữ liệu bạn sẽ nhận được từ API sau khi đăng nhập thành công
 * hoặc khi lấy thông tin profile.
 */
export interface User {
  /**
   * ID duy nhất của người dùng
   * @example "653609a5a1f5f3e7b16d561a"
   */
  id: string;

  /**
   * Tên cửa hàng (dùng để hiển thị)
   */
  storeName: string;

  /**
   * Số điện thoại dùng để đăng nhập
   */
  phone: string;

  /**
   * Tên đầy đủ của chủ cửa hàng (có thể có hoặc không)
   */
  fullName?: string;

  /**
   * Email (có thể có hoặc không)
   */
  email?: string;

  /**
   * Vai trò của người dùng (ví dụ: 'admin', 'owner', 'staff')
   * Dùng để phân quyền
   */
  role: string;

  /**
   * JSON Web Token (JWT)
   * Dùng để xác thực các lần gọi API tiếp theo.
   */
  accessToken: string;
}
