// src/lib/regex.ts

/**
 *  Regex ràng buộc Email
 *  - Đúng chuẩn định dạng username@domain
 *  - Tối đa 255 ký tự (theo DB)
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


/**
 *  Regex ràng buộc Số điện thoại Việt Nam
 *  - Bắt đầu bằng 0
 *  - Cho phép các đầu số thông dụng (3,5,7,8,9)
 *  - Tổng độ dài tối đa 11 ký tự (theo DB)
 */
export const PHONE_REGEX =
  /^0(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9\d)\d{7}$/;


/**
 * Regex ràng buộc Mật khẩu
 * - Độ dài: 8–50 ký tự
 * - Có ít nhất 1 chữ hoa
 * - Có ít nhất 1 chữ thường
 * - Có ít nhất 1 số
 * - Có ít nhất 1 ký tự đặc biệt trong: @$!%*?&+=-_(){}[].,/\|
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&+\=\-_\(\)\{\}\[\]\.,\/\\|])[A-Za-z\d@$!%*?&+\=\-_\(\)\{\}\[\]\.,\/\\|]{8,50}$/;


/**
 * Regex ràng buộc Họ tên
 * - Cho phép chữ cái, dấu, khoảng trắng
 * - Độ dài 1–128 (theo DB)
 */
export const FULL_NAME_REGEX = /^.{1,128}$/;


/**
 * Regex ràng buộc CCCD/CMND
 * - Chỉ số, 9–20 ký tự (theo DB)
 */
export const CITIZEN_ID_REGEX = /^[0-9]{9,20}$/;


/**
 * Regex ràng buộc Địa chỉ
 * - Cho phép chữ, số, dấu câu, khoảng trắng
 * - Độ dài 1–255 (theo DB)
 */
export const ADDRESS_REGEX = /^.{1,255}$/;


/**
 * Regex ràng buộc Dân tộc
 * - Cho phép chữ và khoảng trắng
 * - Độ dài tối đa 20 ký tự (theo DB)
 */
export const ETHNIC_REGEX = /^.{1,20}$/;



/**
 * ====== Hàm kiểm tra hợp lệ ======
 */

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.trim());
};

export const isValidPassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

export const isValidFullName = (name: string): boolean => {
  return FULL_NAME_REGEX.test(name.trim());
};

export const isValidCitizenId = (id: string): boolean => {
  return CITIZEN_ID_REGEX.test(id.trim());
};

export const isValidAddress = (address: string): boolean => {
  return ADDRESS_REGEX.test(address.trim());
};

export const isValidEthnic = (ethnic: string): boolean => {
  return ETHNIC_REGEX.test(ethnic.trim());
};


/**
 * Giữ lại hàm chặn tiếng Việt, nhưng có thể không dùng
 */
export function blockVietnameseInput(e: React.FormEvent<HTMLInputElement>) {
  const inputEvent = e as unknown as InputEvent;
  const char = inputEvent.data;
  if (!char) return;

  const noAccent = char.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  if (char !== noAccent) {
    inputEvent.preventDefault();
  }
}
