// src/lib/regex.ts

/**
 *  Regex ràng buộc Email
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 *  Regex ràng buộc Số điện thoại Việt Nam
 */
export const PHONE_REGEX =
  /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

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
 *  Kiểm tra Email hợp lệ
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 *  Kiểm tra Số điện thoại hợp lệ
 */
export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.trim());
};

/**
 *  Kiểm tra Mật khẩu hợp lệ
 */
export const isValidPassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};


/**
 *  Chặn nhập ký tự có dấu
 * Không ổn lắm --> lỗi nhập tiếng Việt mất chữ
 */  
export function blockVietnameseInput(e: React.FormEvent<HTMLInputElement>) {
  const inputEvent = e as unknown as InputEvent;
  const char = inputEvent.data;

  if(!char) return;

  const noAccent = char.normalize('NFD').replace(/[\u0300-\u036f]/g,"");

  if (char !== noAccent){
    inputEvent.preventDefault();
  }
}