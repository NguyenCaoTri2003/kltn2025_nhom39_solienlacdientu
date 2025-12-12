export const validateDateRange = (
  from: string,
  to: string,
): { isValid: boolean; error?: string } => {
  if (!from && !to) {
    return { isValid: true };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayStr = today.toISOString().split("T")[0];

  if (to && to > todayStr) {
    return {
      isValid: false,
      error: "Ngày kết thúc không được lớn hơn ngày hiện tại",
    };
  }

  if (from && to && from > to) {
    return {
      isValid: false,
      error: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
    };
  }

  return { isValid: true };
};

