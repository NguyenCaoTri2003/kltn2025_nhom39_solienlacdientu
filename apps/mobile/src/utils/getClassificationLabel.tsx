export function getClassificationLabel(enumValue?: string): string {
  if (!enumValue) return "Không xác định";

  switch (enumValue) {
    case "Excellent":
      return "Xuất sắc";
    case "Very_Good":
      return "Giỏi";
    case "Good":
      return "Khá";
    case "Average":
      return "Trung bình";
    case "Weak":
      return "Yếu";
    case "Poor":
      return "Kém";
    default:
      return "Không xác định";
  }
}
