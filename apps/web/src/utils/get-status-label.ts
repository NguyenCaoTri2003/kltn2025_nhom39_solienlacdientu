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

export const getStatusAppointmentLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return { label: "Đã chấp nhận", color: "#16A34A" };
    case "cancelled":
      return { label: "Đã từ chối", color: "#DC2626" };
    case "pending":
      return { label: "Đang chờ", color: "#F59E0B" };
    case "completed":
      return { label: "Đã hoàn thành", color: "#3B82F6" };
    default:
      return { label: "Chờ xác nhận", color: "#6B7280" };
  }
};

export const getFeeStatusLabel = (status: string) => {
  switch (status) {
    case "unpaid":
      return { label: "Chưa đóng", color: "#DC2626" };
    case "partial":
      return { label: "Đóng một phần", color: "#3B82F6" }; 
    case "paid":
      return { label: "Đã đóng", color: "#16A34A" }; 
    default:
      return { label: "Không xác định", color: "#6B7280" }; 
  }
};
