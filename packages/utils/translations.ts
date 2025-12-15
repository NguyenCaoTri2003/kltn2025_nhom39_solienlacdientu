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
  if (!level) return "";
  const levelUpper = level.toUpperCase();
  
  switch (levelUpper) {
    case "FIRST":
      return "Cảnh cáo lần 1";
    case "SECOND":
      return "Cảnh cáo lần 2";
    case "FINAL":
      return "Cảnh cáo lần 3";
    case "EXPULSION":
      return "Buộc thôi học";
    default:
      return level;
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

export function translateNotificationCategory(category?: string): string {
  switch (category) {
    case "all":
      return "Tất cả";
    case "GENERAL":
      return "Chung";
    case "ACADEMIC":
      return "Học vụ";
    case "SYSTEM":
      return "Hệ thống";
    case "FINANCE":
      return "Tài chính";
    case "APPOINTMENT":
      return "Lịch hẹn";
    default:
      return category || "";
  }
}


export function translateSenderType(sender?: string): string {
  switch (sender) {
    case "all":
      return "Tất cả";
    case "university":
      return "Đại học";
    case "lecturer":
      return "Giảng viên";
    case "system":
      return "Hệ thống";
    case "parent":
      return "Phụ huynh";
    default:
      return sender || "";
  }
}



export function statusNotification(status?: string): string {
  switch (status) {
    case "sent":
      return "Đã gửi";
    case "deleted":
      return "Đã xóa";
    default:
      return status || "";
  }
}
