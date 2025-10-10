const classificationMap: Record<string, string> = {
  Excellent: "Xuất sắc",
  Very_Good: "Giỏi",
  Good: "Khá",
  Average: "Trung bình",
  Weak: "Yếu",
  Poor: "Kém",
};

export function getClassificationLabel(classification?: string) {
  return classificationMap[classification ?? ""] ?? "-";
}
