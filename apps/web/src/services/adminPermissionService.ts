declare const process: { env: Record<string, string | undefined> };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type AdminType = "super_admin" | "admin_account" | "admin_academic" | "admin_finance" | null;

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  admin_type: AdminType;
  created_at?: string | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function getJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }
  return data;
}

/**
 * Lấy admin_type của một admin user
 */
export async function getAdminPermission(userId: number): Promise<{ userId: number; admin_type: AdminType }> {
  const data = await getJson<{ returnCode: number; message: string; data: { userId: number; admin_type: AdminType } }>(
    `${API_BASE}/api/users/${userId}/admin-permission`
  );
  if (data.returnCode !== 0) {
    throw new Error(data.message || "Failed to get admin permission");
  }
  return data.data;
}

/**
 * Cập nhật admin_type cho một admin user
 */
export async function updateAdminPermission(
  userId: number,
  adminType: AdminType
): Promise<{ userId: number; admin_type: AdminType }> {
  const data = await getJson<{ returnCode: number; message: string; data: { userId: number; admin_type: AdminType } }>(
    `${API_BASE}/api/users/${userId}/admin-permission`,
    {
      method: "PATCH",
      body: JSON.stringify({ admin_type: adminType }),
    }
  );
  if (data.returnCode !== 0) {
    throw new Error(data.message || "Failed to update admin permission");
  }
  return data.data;
}

/**
 * Lấy danh sách admin với admin_type, hỗ trợ search và pagination
 */
export async function getAllAdminPermissions(params?: {
  search?: string;
  adminType?: AdminType | "all";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.adminType) searchParams.set("adminType", params.adminType);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const url = `${API_BASE}/api/users/admin/permissions${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const data = await getJson<{
    returnCode: number;
    message: string;
    data: AdminUser[];
    meta?: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(url);
  
  if (data.returnCode !== 0) {
    throw new Error(data.message || "Failed to get admin permissions");
  }
  // Sort by created_at desc on client side for consistent ordering
  const itemsSorted = [...(data.data || [])].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });

  return {
    items: itemsSorted,
    total: data.meta?.total || 0,
    page: data.meta?.page || 1,
    pageSize: data.meta?.pageSize || 20,
    totalPages: data.meta?.totalPages || 1,
  };
}

/**
 * Tạo admin user mới
 */
export async function createAdminUser(userData: {
  full_name: string;
  email: string;
  phone: string;
  citizen_id_card?: string;
  address?: string;
  ethnic?: string;
  password?: string;
}): Promise<{ id: number; role: string }> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/users/admin/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({
      user: {
        ...userData,
        role: "admin",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Failed to create admin user");
  }
  // API returns { message, users: [{ id, role }] }
  const createdUser = data?.users?.[0];
  if (!createdUser) {
    throw new Error("Failed to create admin user: No user returned");
  }
  return createdUser;
}

