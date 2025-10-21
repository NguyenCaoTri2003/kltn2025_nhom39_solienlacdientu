export const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "Chờ sinh viên đăng ký", color: "#CA8A04" }; 
    case "planning":
      return { label: "Đang lên kế hoạch", color: "#10B981" }; 
    case "locked":
      return { label: "Đã khóa", color: "#007AFF" }; 
    default:
      return { label: "Không xác định", color: "#6B7280" };
  }
};
