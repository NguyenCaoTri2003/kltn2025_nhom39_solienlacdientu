// utils/translations.ts

export function translateRole(role?: string): string {
  switch (role) {
    case "student":
      return "Sinh viên";
    case "lecturer":
      return "Giảng viên";
    case "parent":
      return "Phụ huynh";
    case "admin":
      return "Quản trị viên";
    default:
      return role || "";
  }
}

export function translateAcademicRank(rank?: string): string {
  switch (rank) {
    case "master":
      return "Thạc sĩ";
    case "doctor":
      return "Tiến sĩ";
    case "associate_professor":
      return "Phó giáo sư";
    case "professor":
      return "Giáo sư";
    default:
      return rank || "";
  }
}

export function translateStatus(status?: string): string {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "inactive":
      return "Bị khóa";
    case "suspended":
      return "Chờ kích hoạt";
    default:
      return status || "";
  }
}
export function translateWarningLevel(level?: string | null): string {
  switch (level) {
    case "minor":
      return "Cảnh cáo nhẹ";
    case "moderate":
      return "Cảnh cáo trung bình";
    case "major":
      return "Cảnh cáo nặng";
    case "severe":
      return "Cảnh cáo nặng";
    case "FIRST":
      return "Cảnh cáo lần 1";
    case "SECOND":
      return "Cảnh cáo lần 2";
    case "FINAL":
      return "Cảnh cáo lần 3";
    default:
      return level || "";
  }
}

export function translateAcademicStatus(status?: string): string {
  switch (status) {
    case "studing":
      return "Đang học";
    case "graduated":
      return "Đã tốt nghiệp";
    case "warned":
      return "Bị cảnh cáo";
    case "suspended":
      return "Bị đình chỉ";
    default:
      return status || "";
  }
}

export function translateTrainingType(type?: string): string {
  switch (type) {
    case "regular":
      return "Đại trà";
    case "advanced":
      return "Chất lượng cao";
    default:
      return type || "";
  }
}

export function translateTrainingLevel(level?: string): string {
  switch (level) {
    case "bachelor":
      return "Đại học";
    case "master":
      return "Thạc sĩ";
    case "phd":
      return "Tiến sĩ";
    default:
      return level || "";
  }
}

export function translateRelationship(relationship?: string): string {
  switch (relationship) {
    case "father":
      return "Cha";
    case "mother":
      return "Mẹ";
    case "guardian":
      return "Người giám hộ";
    default:
      return relationship || "";
  }
}
