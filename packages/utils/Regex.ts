// src/lib/regex.ts

/**
 *  Regex ràng buộc Email
 *  - Đúng chuẩn định dạng username@domain
 *  - Tối đa 255 ký tự (theo DB users.email)
 *  - Có thể NULL trong DB nhưng nếu nhập phải hợp lệ
 */
export const EMAIL_REGEX =
  /^(?=.{1,100}$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 *  Regex ràng buộc Số điện thoại Việt Nam
 *  - Bắt đầu bằng 0
 *  - Cho phép các đầu số thông dụng (3,5,7,8,9)
 *  - Chính xác 11 ký tự (theo DB users.phone VARCHAR(11))
 *  - Bắt buộc NOT NULL
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
 * - Cho phép chữ cái Unicode (bao gồm tiếng Việt), dấu, khoảng trắng
 * - Độ dài 1–128 (theo DB users.full_name VARCHAR(128))
 * - Bắt buộc NOT NULL
 */
export const FULL_NAME_REGEX = /^.{1,128}$/;

/**
 * Regex ràng buộc CCCD/CMND
 * - Chỉ chấp nhận số
 * - Độ dài từ 9 đến 20 ký tự (theo DB users.citizen_id_card VARCHAR(20))
 * - Có thể NULL trong DB
 */
export const CITIZEN_ID_REGEX = /^[0-9]{9,20}$/;

/**
 * Regex ràng buộc Địa chỉ (users.address)
 * - Cho phép chữ, số, dấu câu, khoảng trắng, ký tự Unicode
 * - Độ dài tối đa 255 ký tự (theo DB users.address VARCHAR(255))
 * - Có thể NULL trong DB
 */
export const ADDRESS_REGEX = /^.{0,255}$/;

/**
 * Regex ràng buộc Dân tộc
 * - Cho phép chữ Unicode và khoảng trắng
 * - Độ dài tối đa 20 ký tự (theo DB users.ethnic VARCHAR(20))
 * - Có thể NULL trong DB
 */
export const ETHNIC_REGEX = /^.{0,20}$/;

/**
 * Mã sinh viên
 * - Chỉ chấp nhận chữ cái, số, gạch dưới
 * - Độ dài 1–20 ký tự (theo DB students.student_code VARCHAR(20))
 * - Bắt buộc NOT NULL và UNIQUE
 */
export const STUDENT_CODE_REGEX = /^[A-Za-z0-9_]{1,20}$/;

/**
 * Mã giảng viên
 * - Chỉ chấp nhận chữ cái, số, gạch dưới
 * - Độ dài 1–20 ký tự (theo DB lecturers.lecturer_code VARCHAR(20))
 * - Bắt buộc NOT NULL và UNIQUE
 */
export const LECTURER_CODE_REGEX = /^[A-Za-z0-9_]{1,20}$/;

/**
 * Nghề nghiệp (phụ huynh)
 * - Cho phép mọi ký tự Unicode
 * - Độ dài 0–100 ký tự (theo DB parents.occupation VARCHAR(100))
 * - Có thể NULL trong DB
 */
export const OCCUPATION_REGEX = /^.{0,100}$/;

/**
 * Năm học
 * - Cho phép định dạng: 2024-2025, 2024, v.v.
 * - Độ dài 4–20 ký tự (theo DB students.academic_year VARCHAR(20))
 * - Bắt buộc NOT NULL
 */
export const ACADEMIC_YEAR_REGEX = /^[0-9\-]{4,20}$/;

/**
 * Nơi sinh (students.place_of_birth) / Địa chỉ liên lạc (students.contact_address)
 * - Cho phép mọi ký tự Unicode
 * - Độ dài 0–255 ký tự (theo DB VARCHAR(255))
 * - Có thể NULL trong DB
 */
export const PLACE_OR_CONTACT_ADDRESS_REGEX = /^.{0,255}$/;

/**
 * URL Avatar
 * - Độ dài tối đa 255 ký tự (theo DB users.avatar_url VARCHAR(255))
 * - Có thể NULL trong DB
 */
export const AVATAR_URL_REGEX = /^.{0,255}$/;

/**
 * ====== Hàm kiểm tra hợp lệ ======
 */

export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) return false;
  if (email.length > 255) return false;
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
  if (!id || id.trim().length === 0) return true; // Nullable
  return CITIZEN_ID_REGEX.test(id.trim());
};

export const isValidAddress = (address: string): boolean => {
  if (!address || address.trim().length === 0) return true; // Nullable
  return ADDRESS_REGEX.test(address.trim());
};

export const isValidEthnic = (ethnic: string): boolean => {
  if (!ethnic || ethnic.trim().length === 0) return true; // Nullable
  return ETHNIC_REGEX.test(ethnic.trim());
};

export const isValidStudentCode = (code: string): boolean => {
  return STUDENT_CODE_REGEX.test(code.trim());
};

export const isValidLecturerCode = (code: string): boolean => {
  return LECTURER_CODE_REGEX.test(code.trim());
};

export const isValidOccupation = (occupation: string): boolean => {
  return OCCUPATION_REGEX.test(occupation.trim());
};

export const isValidAcademicYear = (year: string): boolean => {
  return ACADEMIC_YEAR_REGEX.test(year.trim());
};

export const isValidPlaceOrContactAddress = (address: string): boolean => {
  return PLACE_OR_CONTACT_ADDRESS_REGEX.test(address.trim());
};

export const isValidAvatarUrl = (url: string): boolean => {
  if (!url || url.trim().length === 0) return true; // Nullable
  return AVATAR_URL_REGEX.test(url.trim());
};

/**
 * Hàm chặn nhập tiếng Việt có dấu (nếu cần)
 * Sử dụng cho các trường không cho phép Unicode như mã sinh viên, mã giảng viên
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