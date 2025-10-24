export function getRoleLabel(role?: string): string {
  switch (role) {
    case "admin":
      return "Quản trị viên";
    case "lecturer":
      return "Giảng viên";
    case "student":
      return "Sinh viên";
    case "parent":
      return "Phụ huynh";
    default:
      return "Không xác định";
  }
}
