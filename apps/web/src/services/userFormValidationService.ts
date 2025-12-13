import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
  isValidStudentCode,
  isValidLecturerCode,
  isValidOccupation,
  isValidAcademicYear,
  isValidPlaceOrContactAddress,
} from "@packages/utils/Regex";

export type RoleType = "student" | "lecturer" | "parent" | "admin";

export type FormFieldValues = {
  fullName: string;
  email: string;
  phone: string;
  citizenId: string;
  address: string;
  ethnic: string;
  studentCode: string;
  lecturerCode: string;
  occupation: string;
  academicYear: string;
  dateOfBirth: string;
  placeOfBirth: string;
  contactAddress: string;
  classId: number | undefined;
  facultyId: number | undefined;
  academicRank: string;
  childStudentId: string;
  relationship: string;
};

export type ParentFormFieldValues = {
  full_name: string;
  email: string;
  phone: string;
  citizen_id_card: string;
  address: string;
  ethnic: string;
  occupation: string;
  relationship: string;
};

/**
 * Validate a single field
 */
export const validateField = (name: string, value: string): string => {
  switch (name) {
    case "fullName":
      if (!value.trim()) return "Vui lòng không để trống họ và tên";
      if (!isValidFullName(value)) return "Họ và tên không hợp lệ (tối đa 128 ký tự)";
      return "";
    case "email":
      if (!value.trim()) return "Email là bắt buộc";
      if (!isValidEmail(value)) return "Email không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "phone":
      if (!value.trim()) return "Số điện thoại là bắt buộc";
      if (!isValidPhone(value)) return "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
      return "";
    case "citizenId":
      if (!value.trim()) return "CCCD là bắt buộc";
      if (!isValidCitizenId(value)) return "CCCD không hợp lệ (chỉ số, từ 9 đến 20 ký tự)";
      return "";
    case "address":
      if (value && !isValidAddress(value)) return "Địa chỉ không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "ethnic":
      if (value && !isValidEthnic(value)) return "Dân tộc không hợp lệ (tối đa 20 ký tự)";
      return "";
    case "studentCode":
      if (!value.trim()) return "Vui lòng không để trống mã sinh viên";
      if (!isValidStudentCode(value)) return "Mã sinh viên không hợp lệ (chữ, số, gạch dưới, tối đa 20 ký tự)";
      return "";
    case "lecturerCode":
      if (!value.trim()) return "Vui lòng không để trống mã giảng viên";
      if (!isValidLecturerCode(value)) return "Mã giảng viên không hợp lệ (chữ, số, gạch dưới, tối đa 20 ký tự)";
      return "";
    case "occupation":
      if (value && !isValidOccupation(value)) return "Nghề nghiệp không hợp lệ (tối đa 100 ký tự)";
      return "";
    case "academicYear":
      if (!value.trim()) return "Vui lòng không để trống niên khóa";
      if (!isValidAcademicYear(value)) return "Niên khóa không hợp lệ (VD: 2024-2025, 4-20 ký tự)";
      return "";
    case "dateOfBirth":
      if (!value.trim()) return "Ngày sinh là bắt buộc";
      return "";
    case "placeOfBirth":
      if (!value.trim()) return "Nơi sinh là bắt buộc";
      if (!isValidPlaceOrContactAddress(value)) return "Nơi sinh không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "contactAddress":
      if (!value.trim()) return "Địa chỉ liên hệ là bắt buộc";
      if (!isValidPlaceOrContactAddress(value)) return "Địa chỉ liên lạc không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "classId":
      if (!value || value === "0") return "Lớp là bắt buộc";
      return "";
    case "facultyId":
      if (!value || value === "0") return "Khoa là bắt buộc";
      return "";
    case "academicRank":
      if (!value.trim()) return "Học vị là bắt buộc";
      return "";
    case "childStudentId":
      if (!value.trim()) return "ID sinh viên con là bắt buộc";
      return "";
    case "relationship":
      if (!value.trim()) return "Mối quan hệ là bắt buộc";
      return "";
    default:
      return "";
  }
};

/**
 * Validate parent form field
 */
export const validateParentField = (
  name: keyof ParentFormFieldValues,
  value: string
): string => {
  switch (name) {
    case "full_name":
      if (value && !isValidFullName(value)) return "Họ và tên không hợp lệ (tối đa 128 ký tự)";
      return "";
    case "email":
      if (value && !isValidEmail(value)) return "Email không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "phone":
      if (value && !isValidPhone(value)) return "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
      return "";
    case "citizen_id_card":
      if (value && !isValidCitizenId(value)) return "CCCD không hợp lệ (chỉ số, từ 9 đến 20 ký tự)";
      return "";
    case "address":
      if (value && !isValidAddress(value)) return "Địa chỉ không hợp lệ (tối đa 255 ký tự)";
      return "";
    case "ethnic":
      if (value && !isValidEthnic(value)) return "Dân tộc không hợp lệ (tối đa 20 ký tự)";
      return "";
    case "occupation":
      if (value && !isValidOccupation(value)) return "Nghề nghiệp không hợp lệ (tối đa 100 ký tự)";
      return "";
    default:
      return "";
  }
};

/**
 * Get required fields by role
 */
export const getRequiredFieldsByRole = (
  role: RoleType
): Array<{ key: string; getValue: (values: FormFieldValues) => any }> => {
  const baseFields = [
    { key: "fullName", getValue: (v: FormFieldValues) => v.fullName },
    { key: "email", getValue: (v: FormFieldValues) => v.email },
    { key: "phone", getValue: (v: FormFieldValues) => v.phone },
    { key: "citizenId", getValue: (v: FormFieldValues) => v.citizenId },
  ];

  switch (role) {
    case "student":
      return [
        ...baseFields,
        { key: "studentCode", getValue: (v: FormFieldValues) => v.studentCode },
        { key: "classId", getValue: (v: FormFieldValues) => v.classId },
        { key: "dateOfBirth", getValue: (v: FormFieldValues) => v.dateOfBirth },
        { key: "placeOfBirth", getValue: (v: FormFieldValues) => v.placeOfBirth },
        { key: "contactAddress", getValue: (v: FormFieldValues) => v.contactAddress },
        { key: "academicYear", getValue: (v: FormFieldValues) => v.academicYear },
      ];
    case "lecturer":
      return [
        ...baseFields,
        { key: "lecturerCode", getValue: (v: FormFieldValues) => v.lecturerCode },
        { key: "facultyId", getValue: (v: FormFieldValues) => v.facultyId },
        { key: "academicRank", getValue: (v: FormFieldValues) => v.academicRank },
      ];
    case "parent":
      return [
        ...baseFields,
        { key: "childStudentId", getValue: (v: FormFieldValues) => v.childStudentId },
        { key: "relationship", getValue: (v: FormFieldValues) => v.relationship },
      ];
    case "admin":
      return baseFields;
    default:
      return baseFields;
  }
};

/**
 * Check if form is valid
 */
export const validateForm = (
  role: RoleType,
  values: FormFieldValues,
  errors: Record<string, string>,
  parentErrors: Array<Record<string, string>>
): boolean => {
  // Check required fields
  const requiredFields = getRequiredFieldsByRole(role);
  const hasEmptyRequiredFields = requiredFields.some((field) => {
    const value = field.getValue(values);
    return !value || (typeof value === "string" && !value.trim());
  });

  // Check validation errors
  const errorKeys = requiredFields.map((f) => f.key);
  const hasMainErrors = errorKeys.some((k) => !!errors[k]);

  // Check parent form errors (only for student role)
  const hasParentErrors =
    role === "student" && parentErrors.some((pe) => pe && Object.values(pe).some((v) => !!v));

  return !hasEmptyRequiredFields && !hasMainErrors && !hasParentErrors;
};

