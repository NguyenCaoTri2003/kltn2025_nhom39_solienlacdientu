// utils/translations.ts

export function translateRole(role?: string): string {
  switch (role) {
    case "student":
      return "Sinh viên"
    case "lecturer":
      return "Giảng viên"
    case "parent":
      return "Phụ huynh"
    case "admin":
      return "Quản trị viên"
    default:
      return role || ""
  }
}

export function translateAcademicRank(rank?: string): string {
  switch (rank) {
    case "master":
      return "Thạc sĩ"
    case "doctor":
      return "Tiến sĩ"
    case "associate_professor":
      return "Phó giáo sư"
    case "professor":
      return "Giáo sư"
    default:
      return rank || ""
  }
}

export function translateStatus(status?: string): string {
  switch (status) {
    case "active":
      return "Hoạt động"
    case "inactive":
      return "Bị khóa"
    case "suspended":
      return "Chờ kích hoạt"
    default:
      return status || ""
  }
}
export function translateWarningLevel(level?: string): string {
  switch (level) {
    case "minor":
      return "Cảnh cáo nhẹ"
    case "moderate":
      return "Cảnh cáo trung bình"
    case "major":
      return "Cảnh cáo nặng"
    case "severe":
      return "Cảnh cáo nặng"
    default:
      return level || ""
  }
}

export function translateAcademicStatus(status?: string): string {
  switch (status) {
    case "studing":
      return "Đang học"
    case "graduated":
      return "Đã tốt nghiệp"
    case "warned":
      return "Bị cảnh cáo"
    case "suspended":
      return "Bị đình chỉ"
    default:
      return status || ""
  }
}
