"use client";

import React, { useEffect, useState } from "react";
import { translateRole, translateAcademicStatus, translateTrainingType, translateTrainingLevel, translateAcademicRank } from "@packages/utils/translations";
import Loading from "@/components/ui/loading";

type DetailUser = {
  id: number | string;
  full_name: string;
  citizen_id_card?: string | null;
  address?: string | null;
  ethnic?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  last_login?: string | null;
  _code?: string | null;
  lecturer?: {
    lecturer_code?: string | null;
    faculty_name?: string | null;
    academic_rank?: string | null;
    faculties?: { name?: string | null } | null;
  } | null;
  student?: {
    student_code?: string | null;
    class_code?: string | null;
    current_semester_name?: string | null;
    academic_status?: string | null;
    date_of_birth?: string | null;
    place_of_birth?: string | null;
    contact_address?: string | null;
    classes?: { name?: string | null; majors?: { faculties?: { name?: string | null } | null } | null } | null;
    class?: { name?: string | null; majors?: { faculties?: { name?: string | null } | null } | null } | null;
    type_of_tranning?: string | null;
    training_level?: string | null;
    academic_year?: string | null;
  } | null;
  parent?: { occupation?: string | null } | null;
  children?: Array<{
    relationship: string;
    student?: {
      id?: number | string;
      student_code?: string | null;
      academic_status?: string | null;
      class?: { name?: string | null; majors?: { faculties?: { name?: string | null } | null } | null } | null;
    } | null;
    user?: { id?: number | string; role?: string; email?: string | null; phone?: string | null; status?: string | null; full_name?: string | null } | null;
  }>;
  parents?: Array<{
    relationship: string;
    occupation?: string | null;
    user: { full_name: string; phone?: string | null; email?: string | null };
  }>;
};

export function UserDetailModal({ open, userId, onClose }: { open: boolean; userId: string | null; onClose: () => void; }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<DetailUser | null>(null);

  useEffect(() => {
    let ignore = false;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    async function run() {
      if (!open || !userId) return;
      setLoading(true);
      setError(null);
      setUser(null);
      try {
        const token = typeof document !== "undefined"
          ? (document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1] || localStorage.getItem("token"))
          : null;
        const res = await fetch(`${API_BASE}/api/users/detail/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!ignore) {
          if (res.ok) setUser(data);
          else setError(data?.message || "Không thể tải thông tin người dùng");
        }
      } catch {
        if (!ignore) setError("Lỗi kết nối máy chủ");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl bg-white border border-border shadow-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Chi tiết người dùng</h3>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Đóng</button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loading text="Đang tải..." />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : user ? (
            <div className="grid grid-cols-1 gap-y-4">
              <Field label="Họ tên" value={user.full_name} />
              <Field label="Vai trò" value={translateRole(user.role || "-") as string} />
              <Field label="Email" value={user.email || "-"} />
              <Field label="Số điện thoại" value={user.phone || "-"} />
              {/* Ẩn trạng thái theo yêu cầu */}
              <Field label="CCCD" value={user.citizen_id_card || "-"} />
              <Field label="Địa chỉ" value={user.address || "-"} />
              <Field label="Dân tộc" value={user.ethnic || "-"} />
              {/* Ẩn ngày tạo và đăng nhập cuối theo yêu cầu */}
              <Field label="Mã số" value={user._code || user.student?.student_code || user.lecturer?.lecturer_code || "-"} />
              {/* Khoa */}
              {(() => {
                const facultyName =
                  user.lecturer?.faculties?.name ||
                  user.lecturer?.faculty_name ||
                  user.student?.classes?.majors?.faculties?.name ||
                  user.student?.class?.majors?.faculties?.name ||
                  null;
                return facultyName ? <Field label="Khoa" value={facultyName} /> : null;
              })()}
              {/* Học vị (giảng viên) */}
              {user.lecturer?.academic_rank ? (
                <Field label="Học vị" value={translateAcademicRank(user.lecturer.academic_rank) as string} />
              ) : null}
              {/* Lớp */}
              {(() => {
                const className =
                  user.student?.classes?.name ||
                  user.student?.class?.name ||
                  user.student?.class_code ||
                  null;
                return className ? <Field label="Lớp" value={className} /> : null;
              })()}
              {/* Thông tin đào tạo nếu có */}
              {user.student?.type_of_tranning ? (
                <Field label="Loại đào tạo" value={translateTrainingType(user.student.type_of_tranning || "-") as string} />
              ) : null}
              {user.student?.training_level ? (
                <Field label="Trình độ đào tạo" value={translateTrainingLevel(user.student.training_level || "-") as string} />
              ) : null}
              {user.student?.academic_status ? (
                <Field label="Trạng thái học tập" value={translateAcademicStatus(user.student.academic_status || "-") as string} />
              ) : null}
              {user.student?.academic_year ? (
                <Field label="Khóa học" value={user.student.academic_year || "-"} />
              ) : null}
              {user.student?.date_of_birth ? (
                <Field label="Ngày sinh" value={(user.student.date_of_birth || "").slice(0, 10)} />
              ) : null}
              {user.student?.place_of_birth ? (
                <Field label="Nơi sinh" value={user.student.place_of_birth || "-"} />
              ) : null}
              {user.student?.contact_address ? (
                <Field label="Địa chỉ liên hệ" value={user.student.contact_address || "-"} />
              ) : null}
              {user.student?.current_semester_name ? (
                <Field label="Học kỳ hiện tại" value={user.student.current_semester_name} />
              ) : null}

              {/* Nghề nghiệp (nếu là phụ huynh) - nằm ngoài phần Quan hệ gia đình */}
              {user.role === "parent" && user.parent?.occupation ? (
                <Field label="Nghề nghiệp" value={user.parent.occupation || "-"} />
              ) : null}
              <div className="col-span-full">
                <hr className="my-3 border-border/60" />
                <div className="space-y-3">
                  {user.parents?.length ? (
                    <div className="space-y-3">
                      {user.parents.map((p, idx) => (
                        <div key={idx}>
                          <div className="grid grid-cols-1 gap-3">
                            <Field
                              label={
                                p.relationship === "father"
                                  ? "Họ tên cha"
                                  : p.relationship === "mother"
                                  ? "Họ tên mẹ"
                                  : p.relationship === "guardian"
                                  ? "Họ tên người giám hộ"
                                  : "Họ tên"
                              }
                              value={p.user.full_name}
                            />
                            <Field label="Nghề nghiệp" value={p.occupation || "-"} />
                            <Field label="Điện thoại" value={p.user.phone || "-"} />
                            <Field label="Email" value={p.user.email || "-"} />
                          </div>
                          {idx < (user.parents?.length || 0) - 1 ? (
                            <hr className="my-3 border-border/60" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Nghề nghiệp phụ huynh đã đưa ra ngoài khối Quan hệ gia đình */}

                  {user.role === "parent" && user.children?.length ? (
                    <div className="space-y-3">
                      {user.children.map((c, idx) => (
                        <div key={idx}>
                          <div className="grid grid-cols-1 gap-3">
                            <Field label="Họ tên (con)" value={c.user?.full_name || "-"} />
                            <Field label="Quan hệ" value={c.relationship} />
                            <Field label="Mã sinh viên" value={c.student?.student_code || "-"} />
                          <Field label="Trạng thái học tập" value={translateAcademicStatus(c.student?.academic_status || "-") as string} />
                            {(() => {
                              const childClass = c.student?.class?.name || "-";
                              return <Field label="Lớp" value={childClass} />;
                            })()}
                            {(() => {
                              const fac = c.student?.class?.majors?.faculties?.name || "-";
                              return <Field label="Khoa" value={fac} />;
                            })()}
                          </div>
                          {idx < (user.children?.length || 0) - 1 ? (
                            <hr className="my-3 border-border/60" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!user.parents?.length && !(user.role === "parent" && user.children?.length) && !(user.role === "parent" && user.parent) ? (
                    <div className="text-muted-foreground text-sm">Không có thông tin gia đình</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Không có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-row items-center gap-2">
      <label className="text-gray-700 font-medium flex-shrink-0 min-w-[140px]">{label}:</label>
      <input type="text" readOnly value={value} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
    </div>
  );
}

export default UserDetailModal;


