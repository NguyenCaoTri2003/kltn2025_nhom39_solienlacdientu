import { supabase } from "../supabaseClient";
import { User, UserPublic, Role } from "../../core/entities/Users";
import { Student, StudentWithUser } from "@packages/core/entities/Student";
import { Lecturers } from "@packages/core/entities/Lecturers";
import { Parent } from "@packages/core/entities/Parent";
import bcrypt from "bcryptjs";

type RoleSpecificData = {
  student?: Student;
  parent?: Parent;
  lecturer?: Lecturers;
};

export class UserRepository {
  private FriendlyError = class FriendlyError extends Error {
    status: number;
    code: string;
    field?: string;
    constructor(code: string, message: string, status = 400, field?: string) {
      super(message);
      this.name = "FriendlyError";
      this.status = status;
      this.code = code;
      this.field = field;
    }
  };

  private throwFriendlyForUnique(err: any): never {
    const msg = String(err?.message || err?.details || "");
    const code = String(err?.code || ""); // Postgres unique_violation is 23505
    const isUnique = code === "23505" || /duplicate key value/.test(msg);
    if (isUnique) {
      if (/users_email_key/.test(msg)) {
        throw new this.FriendlyError(
          "EMAIL_EXISTS",
          "Email đã tồn tại. Vui lòng sử dụng email khác.",
          409,
          "email"
        );
      }
      if (/users_phone_key/.test(msg)) {
        throw new this.FriendlyError(
          "PHONE_EXISTS",
          "Số điện thoại đã tồn tại. Vui lòng dùng số khác.",
          409,
          "phone"
        );
      }
      if (/students_student_code_key/.test(msg)) {
        throw new this.FriendlyError(
          "STUDENT_CODE_EXISTS",
          "Mã sinh viên đã tồn tại. Vui lòng kiểm tra lại.",
          409,
          "student_code"
        );
      }
      if (/lecturers_lecturer_code_key/.test(msg)) {
        throw new this.FriendlyError(
          "LECTURER_CODE_EXISTS",
          "Mã giảng viên đã tồn tại. Vui lòng kiểm tra lại.",
          409,
          "lecturer_code"
        );
      }

      throw new this.FriendlyError(
        "DUPLICATE",
        "Dữ liệu đã tồn tại. Vui lòng kiểm tra lại các trường trùng lặp.",
        409
      );
    }
    throw err instanceof Error ? err : new Error(msg || "Lỗi không xác định");
  }
  async findById(id: number): Promise<User & { student?: any }> {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (userError || !user) return null;

    if (user.role === "student") {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      if (!studentError && student) {
        return { ...user, student };
      }
    } else if (user.role === "lecturer") {
      const { data: lecturer, error: lecturerError } = await supabase
        .from("lecturers")
        .select("*")
        .eq("id", id)
        .single();
      if (!lecturerError && lecturer) {
        return { ...user, lecturer };
      }
    } else if (user.role === "parent") {
      const { data: parent, error: parentError } = await supabase
        .from("parents")
        .select("*")
        .eq("id", id)
        .single();
      if (!parentError && parent) {
        return { ...user, parent };
      }
    }

    return user;
  }

  async findByStudentCode(studentCode: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("students")
      .select("id, users(*)")
      .eq("student_code", studentCode)
      .single<StudentWithUser>();

    console.log("findByStudentCode data:", data, "error:", error);

    if (error) return null;
    return data.users as User;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();
    if (error) return null;
    return data as User;
  }

  async findByLecturerCode(lecturerCode: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("lecturers")
      .select("id, users(*)")
      .eq("lecturer_code", lecturerCode)
      .single<Lecturers>();
    if (error) return null;
    return data.users as User;
  }

  async findByEmailAdmin(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "admin")
      .single();
    if (error) return null;
    return data as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  }

  async updateUserFull(
    id: number,
    updates: {
      user?: Partial<User>;
      student?: Partial<Student>;
      parent?: Partial<Parent>;
      lecturer?: Partial<Lecturers>;
    }
  ): Promise<User & RoleSpecificData> {
    const { user: userUpdates, student, parent, lecturer } = updates;

    if (userUpdates) {
      const { data } = await supabase
        .from("users")
        .update(userUpdates)
        .eq("id", id)
        .select()
        .single();
      if (!data) throw new Error("Update user failed");
    }

    const { data: userRoleData } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    if (!userRoleData) throw new Error("User not found");

    if (userRoleData.role === "student" && student) {
      await supabase.from("students").update(student).eq("id", id);
    }
    if (userRoleData.role === "parent" && parent) {
      await supabase.from("parents").update(parent).eq("id", id);
    }
    if (userRoleData.role === "lecturer" && lecturer) {
      await supabase.from("lecturers").update(lecturer).eq("id", id);
    }

    const userFull = await this.findById(id);
    if (!userFull) throw new Error("User not found after update");

    return userFull;
  }


  async getAllUsers(): Promise<UserPublic[]> {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, role, status, address, ethnic, citizen_id_card, created_at, last_login"
      )
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];

  }

  async getAllUsersWithPagination(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    roleFilter?: Role | "admin" | "lecturer" | "student" | "parent",
    statusFilter?: "active" | "inactive" | "suspended" | string,
    facultyId?: number,
    classId?: number,
    semesterId?: number
  ): Promise<{
    users: (UserPublic & {
      _code?: string;
      student?: {
        id: number;
        student_code?: string;
        class_id?: number | null;
        class_code?: string | null;
        current_semester_id?: number | null;
        current_semester_name?: string | null;
      };
      lecturer?: {
        id: number;
        lecturer_code?: string;
        faculty_id?: number | null;
        faculty_name?: string | null;
      };
      parent?: { id: number };
    })[];
    total: number;
    totalPages: number;
  }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Chuẩn hóa từ khóa tìm kiếm
    const keyword = (search || "").trim();

    let codeMatchedIds: number[] = [];
    if (keyword) {
      const [studentsMatch, lecturersMatch] = await Promise.all([
        supabase
          .from("students")
          .select("id, student_code")
          .ilike("student_code", `%${keyword}%`),
        supabase
          .from("lecturers")
          .select("id, lecturer_code")
          .ilike("lecturer_code", `%${keyword}%`),
      ]);

      const sIds = (studentsMatch.data || [])
        .map((s: any) => Number(s.id))
        .filter((n) => Number.isFinite(n));
      const lIds = (lecturersMatch.data || [])
        .map((l: any) => Number(l.id))
        .filter((n) => Number.isFinite(n));
      codeMatchedIds = Array.from(new Set([...sIds, ...lIds]));
    }

    let query = supabase
      .from("users")
      .select(
        "id, full_name, email, phone, role, status, created_at, last_login",
        { count: "exact" }
      )
      .order("id", { ascending: true });

    // Lọc theo role/status nếu có
    if (
      roleFilter &&
      ["admin", "lecturer", "student", "parent"].includes(roleFilter)
    ) {
      query = query.eq("role", roleFilter);
    }
    if (
      statusFilter &&
      ["active", "inactive", "suspended"].includes(String(statusFilter))
    ) {
      query = query.eq("status", statusFilter);
    }

    if (keyword) {
      const orParts = [
        `full_name.ilike.%${keyword}%`,
        `email.ilike.%${keyword}%`,
        `phone.ilike.%${keyword}%`,
      ];
      if (codeMatchedIds.length > 0) {
        orParts.push(`id.in.(${codeMatchedIds.join(",")})`);
      }
      query = query.or(orParts.join(","));
    }


    let allowedIds: number[] | undefined;

    if (typeof facultyId === "number" && Number.isFinite(facultyId)) {
      const { data: lecturerRows, error: lecErr } = await supabase
        .from("lecturers")
        .select("id")
        .eq("faculty_id", facultyId);
      if (lecErr) throw lecErr;
      const ids = (lecturerRows || []).map((r: any) => Number(r.id)).filter((n) => Number.isFinite(n));
      allowedIds = Array.from(new Set([...(allowedIds || []), ...ids]));
    }

    if (typeof classId === "number" && Number.isFinite(classId)) {
      const { data: studentRows, error: stuErr } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", classId);
      if (stuErr) throw stuErr;
      const ids = (studentRows || []).map((r: any) => Number(r.id)).filter((n) => Number.isFinite(n));
      if (allowedIds === undefined) allowedIds = ids;
      else allowedIds = allowedIds.filter((id) => ids.includes(id)); // intersect
    }

    if (typeof semesterId === "number" && Number.isFinite(semesterId)) {
      const { data: offeringRows, error: offErr } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("semester_id", semesterId);
      if (offErr) throw offErr;
      const offeringIds = (offeringRows || [])
        .map((r: any) => Number(r.id))
        .filter((n) => Number.isFinite(n));

      let ids: number[] = [];
      if (offeringIds.length > 0) {
        const { data: enrollmentRows, error: enrErr } = await supabase
          .from("enrollment")
          .select("student_id")
          .in("offering_id", offeringIds);
        if (enrErr) throw enrErr;
        ids = Array.from(
          new Set(
            (enrollmentRows || [])
              .map((r: any) => Number(r.student_id))
              .filter((n) => Number.isFinite(n))
          )
        );
      }
      if (allowedIds === undefined) allowedIds = ids;
      else allowedIds = allowedIds.filter((id) => ids.includes(id)); // intersect
    }

    if (allowedIds && allowedIds.length > 0) {
      query = query.in("id", allowedIds);
    } else if (allowedIds && allowedIds.length === 0) {
      return { users: [], total: 0, totalPages: 0 };
    }

    const { data: users, error, count } = await query.range(from, to);
    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    if (!users?.length) {
      return { users: [], total, totalPages };
    }

    const roleGroups = {
      student: users.filter((u) => u.role === "student").map((u) => u.id),
      lecturer: users.filter((u) => u.role === "lecturer").map((u) => u.id),
      parent: users.filter((u) => u.role === "parent").map((u) => u.id),
    };

    const { data: students } = roleGroups.student.length
      ? await supabase
          .from("students")
          .select("id, student_code, class_id, classes:class_id(id, class_code)")
          .in("id", roleGroups.student)
      : { data: [] };

    const { data: lecturers } = roleGroups.lecturer.length
      ? await supabase
          .from("lecturers")
          .select("id, lecturer_code, faculty_id, faculties:faculty_id(id, name)")
          .in("id", roleGroups.lecturer)
      : { data: [] };

    let semesterLabel: { id: number; name: string } | null = null;
    if (typeof semesterId === "number" && Number.isFinite(semesterId)) {
      const { data: semRow } = await supabase
        .from("semesters")
        .select("id, name")
        .eq("id", semesterId)
        .maybeSingle();
      if (semRow) {
        semesterLabel = { id: semRow.id, name: semRow.name };
      }
    }

    const mergedUsers = users.map((u) => {
      let _code: string | undefined;
      let studentObj:
        | {
            id: number;
            student_code?: string;
            class_id?: number | null;
            class_code?: string | null;
            current_semester_id?: number | null;
            current_semester_name?: string | null;
          }
        | undefined;
      let lecturerObj:
        | {
            id: number;
            lecturer_code?: string;
            faculty_id?: number | null;
            faculty_name?: string | null;
          }
        | undefined;
      let parentObj: { id: number } | undefined;

      if (u.role === "student") {
        const found = (students as any[])?.find((s) => s.id === u.id);
        _code = found?.student_code;
        studentObj = {
          id: u.id,
          student_code: found?.student_code,
          class_id: found?.class_id ?? null,
          class_code: found?.classes?.class_code ?? null,
          current_semester_id: semesterLabel ? semesterLabel.id : null,
          current_semester_name: semesterLabel ? semesterLabel.name : null,
        };
      } else if (u.role === "lecturer") {
        const found = (lecturers as any[])?.find((l) => l.id === u.id);
        _code = found?.lecturer_code;
        lecturerObj = {
          id: u.id,
          lecturer_code: found?.lecturer_code,
          faculty_id: found?.faculty_id ?? null,
          faculty_name: found?.faculties?.name ?? null,
        };
      } else if (u.role === "parent") {
        parentObj = { id: u.id };
      }

      return {
        ...u,
        _code,
        ...(studentObj ? { student: studentObj } : {}),
        ...(lecturerObj ? { lecturer: lecturerObj } : {}),
        ...(parentObj ? { parent: parentObj } : {}),
      };
    });

    return { users: mergedUsers, total, totalPages };
  }

  async updateUserStatus(
    id: number,
    status: "active" | "inactive" | "suspended"
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  }


  async createUserWithRole(data: {
  user: Partial<User>;
  student?: Partial<Student>;
  parent?: Partial<Parent>;
  lecturer?: Partial<Lecturers>;
  student_parent?: { student_id: number; relationship: "father" | "mother" | "guardian" };
}): Promise<User> {
  const { user, student, parent, lecturer, student_parent } = data;

  const passwordHash = await bcrypt.hash("11111111", 10);

  const { data: userInserted, error: userError } = await supabase
    .from("users")
    .insert({
      full_name: user.full_name,
      password_hash: passwordHash,
      role: user.role,
      phone: user.phone,
      email: user.email,
      status: "suspended",
      citizen_id_card: user.citizen_id_card ?? null,
      address: user.address ?? null,
      ethnic: user.ethnic ?? null,
    })
    .select("id, role")
    .single();

  if (userError) {
    console.error("❌ Lỗi khi tạo user:", userError);
    this.throwFriendlyForUnique(userError);
  }

  const newUserId = userInserted.id;

  try {
    switch (userInserted.role) {

      case "student":
        if (!student) throw new Error("Thiếu dữ liệu sinh viên");
        {
          const { error } = await supabase.from("students").insert({
            id: newUserId,
            student_code: student.student_code,
            class_id: student.class_id ?? null,
            academic_status: "studing",
            date_of_birth: student.date_of_birth ?? null,
            place_of_birth: student.place_of_birth ?? null,
            contact_address: student.contact_address ?? null,
            type_of_tranning: (student as any).type_of_training ?? "regular",
            training_level: student.training_level ?? "bachelor",
            academic_year: student.academic_year ?? "2025",
          });
          if (error) this.throwFriendlyForUnique(error);
        }
        break;

      case "parent":
        if (!parent) throw new Error("Thiếu dữ liệu phụ huynh");
        if (!student_parent)
          throw new Error("Phải cung cấp student_parent (student_id và relationship) khi tạo phụ huynh");
        {
          const { error: parentError } = await supabase.from("parents").insert({
            id: newUserId,
            occupation: parent.occupation ?? null,
          });
          if (parentError) throw parentError;

          const { error: spError } = await supabase.from("student_parent").insert({
            student_id: student_parent.student_id,
            parent_id: newUserId,
            relationship: student_parent.relationship,
          });
          if (spError) throw spError;
        }
        break;

      case "lecturer":
        if (!lecturer) throw new Error("Thiếu dữ liệu giảng viên");
        {
          const { error } = await supabase.from("lecturers").insert({
            id: newUserId,
            lecturer_code: lecturer.lecturer_code,
            academic_rank: lecturer.academic_rank ?? "none",
            faculty_id: lecturer.faculty_id ?? null,
          });
          if (error) this.throwFriendlyForUnique(error);
        }
        break;

      case "admin": {
        console.log("Tạo tài khoản admin.");
        break;
      }

      default:
        console.warn(`⚠ Role '${userInserted.role}' chưa được xử lý.`);
        break;
    }

    return { id: newUserId, ...userInserted } as User;
  } catch (err: any) {
    console.error("❌ Lỗi khi thêm bảng con, rollback user:", err.message);
    await supabase.from("users").delete().eq("id", newUserId);
    throw new Error(err.message);
  }
}


  async createManyUsersFromExcel(rows: any[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      // Gọi lại hàm cũ để tạo từng user
      await this.createUserWithRole({
        user: {
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          citizen_id_card: row.citizen_id_card,
          address: row.address,
          ethnic: row.ethnic,
        },
        student: row.role === "student" ? {
          student_code: row.student_code,
          class_id: row.class_id,
          date_of_birth: row.date_of_birth,
          place_of_birth: row.place_of_birth,
          contact_address: row.contact_address,
          type_of_training: row.type_of_training || "regular",
          training_level: row.training_level,
          academic_year: row.academic_year,
        } : undefined,

        lecturer: row.role === "lecturer" ? {
          lecturer_code: row.lecturer_code,
          academic_rank: row.academic_rank,
          faculty_id: row.faculty_id,
        } : undefined,

        parent: row.role === "parent" ? {
          occupation: row.occupation,
        } : undefined,

        student_parent: row.role === "parent" ? {
          student_id: row.student_id,       
          relationship: row.relationship || "guardian", 
        } : undefined,
      });

      success++;
    } catch (err) {
      console.error("❌ Lỗi tạo user từ Excel:", err);
      failed++;
    }
  }

  return { success, failed };
}

}
