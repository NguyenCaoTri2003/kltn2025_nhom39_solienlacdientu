export type ApiUser = {
  id: number | string;
  full_name: string;
  email: string;
  role: "admin" | "lecturer" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  _code?: string | null;
};

interface FetchUsersParams {
  page: number;
  limit: number;
  search?: string;
  status?: "all" | "active" | "inactive" | "suspended";
  role?: "all" | "admin" | "lecturer" | "student" | "parent";
  token: string | null;
  apiBase: string;
}

interface FetchUsersResponse {
  users: ApiUser[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

/**
 * Lấy token từ localStorage hoặc cookie
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  return cookieToken || localStorage.getItem("token");
};

/**
 * Fetch danh sách users với filter và pagination
 */
export const fetchUsers = async (params: FetchUsersParams): Promise<FetchUsersResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.role && params.role !== "all") {
    searchParams.set("role", params.role);
  }

  const res = await fetch(`${params.apiBase}/api/users?${searchParams.toString()}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || result.returnCode !== 0 || !Array.isArray(result.data?.users)) {
    throw new Error(result?.message || `Fetch users failed (${res.status})`);
  }

  const pag = result.data?.pagination;
  return {
    users: result.data.users as ApiUser[],
    pagination: {
      page: pag?.page || params.page,
      totalPages: pag?.totalPages || 1,
      total: pag?.total || 0,
    },
  };
};

/**
 * Fetch tất cả users với filter (dùng cho chọn tất cả)
 */
export const fetchAllUsers = async (
  params: Omit<FetchUsersParams, "page" | "limit">
): Promise<ApiUser[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", "1");
  searchParams.set("limit", "10000"); 
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.role && params.role !== "all") {
    searchParams.set("role", params.role);
  }

  const res = await fetch(`${params.apiBase}/api/users?${searchParams.toString()}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || result.returnCode !== 0 || !Array.isArray(result.data?.users)) {
    throw new Error(result?.message || `Fetch all users failed (${res.status})`);
  }

  return result.data.users as ApiUser[];
};

/**
 * Tính toán trạng thái chọn tất cả trong trang hiện tại
 */
export const calculateSelectAllInPage = (
  users: ApiUser[],
  selectedIds: Set<number>
): boolean => {
  return users.length > 0 && users.every((u) => selectedIds.has(Number(u.id)));
};

/**
 * Tính toán danh sách ID để chọn/bỏ chọn khi toggle select all
 */
export const calculateToggleSelectAllUsers = (
  allUsers: ApiUser[],
  currentSelectedIds: Set<number>
): {
  newSelectedIds: Set<number>;
  newSelectedUsers: Map<number, ApiUser>;
  count: number;
} => {
  const allUserIds = allUsers.map((u) => Number(u.id));
  const allSelected = allUserIds.every((id) => currentSelectedIds.has(id));

  const newSelectedIds = new Set(currentSelectedIds);
  const newSelectedUsers = new Map<number, ApiUser>();

  if (allSelected) {
    allUserIds.forEach((id) => {
      newSelectedIds.delete(id);
    });
  } else {
    allUsers.forEach((user) => {
      const userId = Number(user.id);
      newSelectedIds.add(userId);
      newSelectedUsers.set(userId, user);
    });
  }

  return {
    newSelectedIds,
    newSelectedUsers,
    count: allUserIds.length,
  };
};

