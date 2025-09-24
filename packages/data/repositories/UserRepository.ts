import { supabase } from "../supabaseClient";
import { User } from "../../core/entities/Users";
import { Student, StudentWithUser } from "@/core/entities/Student";
import { Lecturers } from "@/core/entities/Lecturers";
import { Parent } from "@/core/entities/Parent";

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

    if (user.role === "STUDENT") {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      if (!studentError && student) {
        return { ...user, student };
      }
    } else if (user.role === "LECTURER") {
      const { data: lecturer, error: lecturerError } = await supabase
        .from("lecturers")
        .select("*")
        .eq("id", id)
        .single();
      if (!lecturerError && lecturer) {
        return { ...user, lecturer };
      }
    } else if (user.role === "PARENT") {
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

    if (error) return null;
    return data.users as User;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("phone", phone).single();
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

    if (userRoleData.role === "STUDENT" && student) {
      await supabase.from("students").update(student).eq("id", id);
    }
    if (userRoleData.role === "PARENT" && parent) {
      await supabase.from("parents").update(parent).eq("id", id);
    }
    if (userRoleData.role === "LECTURER" && lecturer) {
      await supabase.from("lecturers").update(lecturer).eq("id", id);
    }

    const userFull = await this.findById(id);
    if (!userFull) throw new Error("User not found after update");

    return userFull; 
  }
}
