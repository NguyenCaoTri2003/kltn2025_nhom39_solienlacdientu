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
