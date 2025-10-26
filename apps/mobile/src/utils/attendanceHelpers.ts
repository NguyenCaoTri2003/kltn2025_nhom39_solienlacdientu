export const statusMap: Record<string, { label: string; color: string }> = {
  present: { label: "Có mặt", color: "green" },
  absent: { label: "Vắng", color: "red" },
  late: { label: "Đi muộn", color: "orange" },
  excused: { label: "Có phép", color: "#3B82F6" },
};

export const typeMap: Record<string, string> = {
  theory: "Lý thuyết",
  practice: "Thực hành",
};

/**
 * Format ngày giờ thành DD/MM/YYYY
 */
export function formatDateTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // hour12: false,
    // timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}