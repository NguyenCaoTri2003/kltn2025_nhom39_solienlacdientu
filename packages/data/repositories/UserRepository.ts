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

  async getAllUsersWithPagination(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    roleFilter?: Role | "admin" | "lecturer" | "student" | "parent",
    statusFilter?: "active" | "inactive" | "suspended" | string
  ): Promise<{
    users: (UserPublic & {
      _code?: string;
      student?: { id: number; student_code?: string };
      lecturer?: { id: number; lecturer_code?: string };
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
          .select("id, student_code")
          .in("id", roleGroups.student)
      : { data: [] };

    const { data: lecturers } = roleGroups.lecturer.length
      ? await supabase
          .from("lecturers")
          .select("id, lecturer_code")
          .in("id", roleGroups.lecturer)
      : { data: [] };

    const mergedUsers = users.map((u) => {
      let _code: string | undefined;
      let studentObj: { id: number; student_code?: string } | undefined;
      let lecturerObj: { id: number; lecturer_code?: string } | undefined;
      let parentObj: { id: number } | undefined;

      if (u.role === "student") {
        const found = students?.find((s) => s.id === u.id);
        _code = found?.student_code;
        studentObj = { id: u.id, student_code: found?.student_code };
      } else if (u.role === "lecturer") {
        const found = lecturers?.find((l) => l.id === u.id);
        _code = found?.lecturer_code;
        lecturerObj = { id: u.id, lecturer_code: found?.lecturer_code };
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
  }): Promise<User> {
    const { user, student, parent, lecturer } = data;

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
      throw new Error("Lỗi khi tạo user: " + userError.message);
    }

    const newUserId = userInserted.id;

    try {
      //  Thêm bảng phụ theo role
      switch (userInserted.role) {
        case "student":
          if (!student) throw new Error("Thiếu dữ liệu sinh viên");
          {
            const { error } = await supabase.from("students").insert({
              id: newUserId,
              student_code: student.student_code,
              class_id: student.class_id ?? null,
              academic_status: student.academic_status ?? "studing", // khớp enum DB
              date_of_birth: student.date_of_birth ?? null,
              place_of_birth: student.place_of_birth ?? null,
              contact_address: student.contact_address ?? null,
              type_of_tranning: (student as any).type_of_training ?? "regular",
              training_level: student.training_level ?? "bachelor", // khớp enum DB
              academic_year: student.academic_year ?? "2025",
            });
            if (error)
              throw new Error("Lỗi khi tạo sinh viên: " + error.message);
          }
          break;

        case "parent":
          if (!parent) throw new Error("Thiếu dữ liệu phụ huynh");
          {
            const { error } = await supabase.from("parents").insert({
              id: newUserId,
              occupation: parent.occupation ?? null,
            });
            if (error)
              throw new Error("Lỗi khi tạo phụ huynh: " + error.message);
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
            if (error)
              throw new Error("Lỗi khi tạo giảng viên: " + error.message);
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

      // Thành công
      return { id: newUserId, ...userInserted } as User;
    } catch (err: any) {
      console.error("❌ Lỗi khi thêm bảng con, rollback user:", err.message);

      // Rollback: xóa user cha nếu bảng con thêm thất bại
      await supabase.from("users").delete().eq("id", newUserId);

      throw new Error(err.message);
    }
  }
}
