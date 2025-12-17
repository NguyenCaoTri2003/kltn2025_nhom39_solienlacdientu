/**
 * Xử lý và làm sạch dữ liệu role
 */
export function processRole(role: string | null | undefined): string {
  if (!role || role === "unknown" || role.trim() === "") {
    return "Khác";
  }
  const roleMap: Record<string, string> = {
    student: "Sinh viên",
    lecturer: "Giảng viên",
    parent: "Phụ huynh",
    admin: "Quản trị viên"
  };
  return roleMap[role.toLowerCase()] || role;
}

/**
 * Xử lý và làm sạch dữ liệu status
 */
export function processStatus(status: string | null | undefined): string {
  if (!status || status === "unknown" || status.trim() === "") {
    return "Khác";
  }
  const statusMap: Record<string, string> = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
    suspended: "Tạm khóa"
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Xử lý và làm sạch dữ liệu notification type
 */
export function processNotificationType(type: string | null | undefined): string {
  if (!type || type === "unknown" || type.trim() === "") {
    return "Khác";
  }
  const typeMap: Record<string, string> = {
    university: "Đại học",
    lecturer: "Giảng viên",
    system: "Hệ thống",
    parent: "Phụ huynh"
  };
  return typeMap[type.toLowerCase()] || type;
}

/**
 * Xử lý và làm sạch dữ liệu notification category
 */
export function processNotificationCategory(category: string | null | undefined): string {
  if (!category || category === "unknown" || category.trim() === "") {
    return "Khác";
  }
  const categoryMap: Record<string, string> = {
    academic: "Học tập",
    system: "Hệ thống",
    finance: "Tài chính",
    general: "Chung",
    appointment: "Lịch hẹn"
  };
  return categoryMap[category.toLowerCase()] || category;
}

/**
 * Xử lý và làm sạch dữ liệu warning level
 */
export function processWarningLevel(level: string | null | undefined): string {
  if (!level || level === "unknown" || level.trim() === "") {
    return "Khác";
  }
  const levelMap: Record<string, string> = {
    first: "Cảnh cáo 1",
    second: "Cảnh cáo 2",
    final: "Cảnh cáo 3",
    expulsion: "Buộc thôi học"
  };
  return levelMap[level.toLowerCase()] || level;
}

/**
 * Xử lý và làm sạch dữ liệu appointment status
 */
export function processAppointmentStatus(status: string | null | undefined): string {
  if (!status || status === "unknown" || status.trim() === "") {
    return "Khác";
  }
  const statusMap: Record<string, string> = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy"
  };
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Gộp các mục "Khác" và "unknown" lại với nhau
 */
export function mergeUnknownItems<T extends { [key: string]: any }>(
  items: T[],
  keyField: keyof T
): T[] {
  const result: T[] = [];
  const unknownItems: T[] = [];
  let otherCount = 0;

  items.forEach(item => {
    const value = String(item[keyField] || "").toLowerCase();
    if (value === "khác" || value === "unknown" || value === "" || !value) {
      unknownItems.push(item);
      otherCount += Number(item.count || 0);
    } else {
      result.push(item);
    }
  });

  // Nếu có các mục unknown, gộp lại thành một mục "Khác"
  if (otherCount > 0) {
    const otherItem = { ...unknownItems[0] } as T;
    (otherItem as any)[keyField] = "Khác";
    (otherItem as any).count = otherCount;
    result.push(otherItem);
  }

  return result;
}

