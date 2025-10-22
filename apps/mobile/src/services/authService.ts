import { API_URL } from "../constants/config";

export async function login(identifier: string, password: string, role: "student" | "parent") {
  console.log("API_URL:", API_URL);

  try {
    const res = await fetch(`${API_URL}/api/auth/login/studentorparent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại");
    return data;
  } catch (err) {
    throw err;
  }
}
