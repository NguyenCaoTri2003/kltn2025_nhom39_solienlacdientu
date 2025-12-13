export type AccountStatus = "active" | "inactive" | "suspended";
export type AccountRole = "admin" | "lecturer" | "student" | "parent";

export interface Account {
  id: string;
  code?: string;
  name: string;
  role: AccountRole;
  status: AccountStatus;
  lastLogin: string | null;
  email: string;
  lecturerFacultyName?: string | null;
  studentClassCode?: string | null;
  studentSemesterName?: string | null;
}

interface ApiUser {
  id: number | string;
  full_name: string;
  email: string;
  role: AccountRole | string;
  status: AccountStatus | string;
  last_login?: string | null;
  _code?: string | null;
  lecturer?: { faculty_name?: string | null } | null;
  student?: {
    class_code?: string | null;
    current_semester_name?: string | null;
  } | null;
}

interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchAccountsParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: "all" | AccountRole;
  status?: "all" | AccountStatus;
  facultyId?: number | null;
  classId?: number | null;
  semesterId?: number | null;
  token: string | null;
  apiBase: string;
}

interface FetchAccountsResponse {
  accounts: Account[];
  pagination: ApiPagination;
}

/**
 * Lấy token từ localStorage 
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
 * Fetch danh sách accounts với filter và pagination
 */
export const fetchAccounts = async (
  params: FetchAccountsParams
): Promise<FetchAccountsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.role && params.role !== "all") searchParams.set("role", params.role);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.facultyId) searchParams.set("faculty_id", String(params.facultyId));
  if (params.classId) searchParams.set("class_id", String(params.classId));
  if (params.semesterId) searchParams.set("semester_id", String(params.semesterId));

  const res = await fetch(`${params.apiBase}/api/users?${searchParams.toString()}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok || result.returnCode !== 0 || !Array.isArray(result.data?.users)) {
    let errorMessage = "Không thể tải danh sách người dùng";
    if (res.status === 401) {
      errorMessage = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)";
    } else if (res.status === 403) {
      errorMessage = "Bạn không có quyền truy cập tài nguyên này (403)";
    } else if (result.message) {
      errorMessage = result.message;
    }
    throw new Error(errorMessage);
  }

  const pag: ApiPagination | undefined = result.data?.pagination;
  const mapped = (result.data.users as ApiUser[]).map(
    (u: ApiUser): Account => ({
      id: String(u.id),
      code: u._code ?? undefined,
      name: u.full_name,
      role: u.role as AccountRole,
      status: u.status as AccountStatus,
      email: u.email,
      lastLogin: u.last_login ?? null,
      lecturerFacultyName: u.lecturer?.faculty_name ?? null,
      studentClassCode: u.student?.class_code ?? null,
      studentSemesterName: u.student?.current_semester_name ?? null,
    })
  );

  return {
    accounts: mapped,
    pagination: pag || {
      page: params.page,
      limit: params.pageSize,
      total: mapped.length,
      totalPages: 1,
    },
  };
};

/**
 * Cập nhật trạng thái của một user
 */
export const updateUserStatus = async (
  accountId: string,
  status: AccountStatus,
  token: string | null,
  apiBase: string
): Promise<{ ok: boolean; status?: AccountStatus; message?: string }> => {
  const res = await fetch(`${apiBase}/api/users/${accountId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok || result?.returnCode !== 0) {
    let msg = "Không thể cập nhật trạng thái người dùng";
    if (res.status === 401) {
      msg = "Bạn chưa đăng nhập hoặc phiên đã hết hạn (401)";
    } else if (res.status === 403) {
      msg = "Bạn không có quyền cập nhật trạng thái (403)";
    } else if (result?.message) {
      msg = result.message;
    }
    return { ok: false, message: msg };
  }

  return {
    ok: true,
    status: result?.data?.status || status,
  };
};

/**
 * Cập nhật trạng thái hàng loạt cho nhiều users
 */
export const bulkUpdateUserStatus = async (
  accountIds: string[],
  status: AccountStatus,
  token: string | null,
  apiBase: string
): Promise<{ successIds: string[]; failedCount: number }> => {
  const results = await Promise.allSettled(
    accountIds.map((id) =>
      fetch(`${apiBase}/api/users/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }).then(async (r) => ({
        ok: r.ok,
        json: await r.json().catch(() => ({})),
      }))
    )
  );

  const successIds: string[] = [];
  const failedCount = results.reduce((acc, res, idx) => {
    if (
      res.status === "fulfilled" &&
      res.value.ok &&
      res.value.json?.returnCode === 0
    ) {
      successIds.push(accountIds[idx]);
      return acc;
    }
    return acc + 1;
  }, 0);

  return { successIds, failedCount };
};

/**
 * Fetch danh sách faculties
 */
export const fetchFaculties = async (
  apiBase: string
): Promise<Array<{ id: number; name: string }>> => {
  const res = await fetch(`${apiBase}/api/faculties`, {
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(json?.data)) {
    throw new Error("Không thể tải danh sách khoa");
  }

  return json.data.map((f: { id: number; name: string }) => ({
    id: f.id,
    name: f.name,
  }));
};

/**
 * Fetch danh sách classes
 */
export const fetchClasses = async (
  token: string | null,
  apiBase: string
): Promise<Array<{ id: number; class_code: string }>> => {
  const res = await fetch(`${apiBase}/api/classes`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(json?.data)) {
    throw new Error("Không thể tải danh sách lớp");
  }

  return json.data.map((c: { id: number; class_code: string }) => ({
    id: c.id,
    class_code: c.class_code,
  }));
};

/**
 * Fetch danh sách semesters
 */
export const fetchSemesters = async (
  token: string | null,
  apiBase: string
): Promise<Array<{ id: number; name: string }>> => {
  const res = await fetch(`${apiBase}/api/semesters`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(json?.data)) {
    throw new Error("Không thể tải danh sách học kỳ");
  }

  return json.data.map((s: { id: number; name: string }) => ({
    id: s.id,
    name: s.name,
  }));
};

/**
 * Fetch thông tin chi tiết của một user
 */
export const fetchUserById = async (
  userId: string,
  token: string | null,
  apiBase: string
): Promise<any> => {
  const res = await fetch(`${apiBase}/api/users/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let errorMessage = "Không thể tải thông tin người dùng";
    if (res.status === 401) {
      errorMessage = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)";
    } else if (res.status === 403) {
      errorMessage = "Bạn không có quyền truy cập tài nguyên này (403)";
    } else if (data?.error) {
      errorMessage = data.error;
    }
    throw new Error(errorMessage);
  }

  return await res.json();
};

/**
 * Cập nhật thông tin của một user
 */
export const updateUser = async (
  userId: string,
  updates: Record<string, string>,
  token: string | null,
  apiBase: string
): Promise<any> => {
  const res = await fetch(`${apiBase}/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ user: updates }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let errorMessage = "Không thể cập nhật thông tin";
    if (res.status === 401) {
      errorMessage = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)";
    } else if (res.status === 403) {
      errorMessage = "Bạn không có quyền cập nhật thông tin (403)";
    } else if (data?.error) {
      errorMessage = data.error;
    }
    throw new Error(errorMessage);
  }

  return data;
};

