import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";
import { User } from "@packages/core/entities/UserRole";

export async function fetchUserById(id: number): Promise<User> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  return json;
}
