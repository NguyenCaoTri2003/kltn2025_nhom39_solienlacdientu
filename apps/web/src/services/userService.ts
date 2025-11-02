import { User } from "@packages/core/entities/UserRole";

export async function fetchUserById(id: number): Promise<User> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  return json;
}
