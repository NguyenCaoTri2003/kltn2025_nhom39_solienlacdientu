
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
  isValidStudentCode,
  isValidLecturerCode,
  isValidOccupation,
  isValidAcademicYear,
  isValidPlaceOrContactAddress,
} from "@packages/utils/Regex";

const userRepo = new UserRepository();

/**
 * POST /api/users/admin/create
 * Tạo người dùng theo role (student, parent, lecturer)
 * - Admin only
 */
export async function POST(req: NextRequest) {
  try {
    let authUser;
    try {
      authUser = await authenticate(req);
    } catch {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }
    if (authUser.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Admin only", data: null },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { user, student, parents, parent, lecturer, student_parent } = body;

    if (!user?.full_name || !user?.role) {
      return NextResponse.json(
        { error: "Thiếu thông tin user hoặc role." },
        { status: 400 }
      );
    }

    //  Validate cơ bản cho user
    if (!isValidFullName(user.full_name)) {
      return NextResponse.json(
        { error: "Họ tên không hợp lệ (1–128 ký tự)." },
        { status: 400 }
      );
    }
    if (user.email && !isValidEmail(user.email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }
    if (!isValidPhone(user.phone)) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ." },
        { status: 400 }
      );
    }
    if (user.citizen_id_card && !isValidCitizenId(user.citizen_id_card)) {
      return NextResponse.json({ error: "CCCD/CMND không hợp lệ." }, { status: 400 });
    }
    if (user.address && !isValidAddress(user.address)) {
      return NextResponse.json({ error: "Địa chỉ không hợp lệ." }, { status: 400 });
    }
    if (user.ethnic && !isValidEthnic(user.ethnic)) {
      return NextResponse.json({ error: "Dân tộc không hợp lệ." }, { status: 400 });
    }

    // Kiểm tra logic theo role
    if (user.role === "parent") {
      if (!parent) {
        return NextResponse.json(
          { error: "Thiếu thông tin parent khi tạo phụ huynh." },
          { status: 400 }
        );
      }
      if (!student_parent) {
        return NextResponse.json(
          { error: "Phụ huynh phải liên kết ít nhất một học sinh (student_parent)." },
          { status: 400 }
        );
      }
      if (!isValidOccupation(parent.occupation)) {
        return NextResponse.json({ error: "Nghề nghiệp không hợp lệ." }, { status: 400 });
      }
    }

    if (user.role === "student") {
      if (!student) {
        return NextResponse.json(
          { error: "Thiếu thông tin student khi tạo học sinh." },
          { status: 400 }
        );
      }
      if (!isValidStudentCode(student.student_code)) {
        return NextResponse.json({ error: "Mã sinh viên không hợp lệ." }, { status: 400 });
      }
      if (student.academic_year && !isValidAcademicYear(student.academic_year)) {
        return NextResponse.json({ error: "Năm học không hợp lệ." }, { status: 400 });
      }
      if (
        student.place_of_birth &&
        !isValidPlaceOrContactAddress(student.place_of_birth)
      ) {
        return NextResponse.json({ error: "Nơi sinh không hợp lệ." }, { status: 400 });
      }
      if (
        student.contact_address &&
        !isValidPlaceOrContactAddress(student.contact_address)
      ) {
        return NextResponse.json({ error: "Địa chỉ liên lạc không hợp lệ." }, { status: 400 });
      }

      // Kiểm tra parents nếu có
      if (parents && !Array.isArray(parents)) {
        return NextResponse.json({ error: "parents phải là một mảng." }, { status: 400 });
      }
      if (Array.isArray(parents)) {
        for (const p of parents) {
          if (!p.user?.full_name || !isValidFullName(p.user.full_name)) {
            return NextResponse.json(
              { error: `Tên phụ huynh '${p.user?.full_name}' không hợp lệ.` },
              { status: 400 }
            );
          }
          if (p.user?.email && !isValidEmail(p.user.email)) {
            return NextResponse.json(
              { error: `Email của phụ huynh '${p.user?.full_name}' không hợp lệ.` },
              { status: 400 }
            );
          }
          if (!isValidPhone(p.user?.phone)) {
            return NextResponse.json(
              { error: `Số điện thoại của phụ huynh '${p.user?.full_name}' không hợp lệ.` },
              { status: 400 }
            );
          }
          if (p.parent?.occupation && !isValidOccupation(p.parent.occupation)) {
            return NextResponse.json(
              { error: `Nghề nghiệp của phụ huynh '${p.user?.full_name}' không hợp lệ.` },
              { status: 400 }
            );
          }
        }
      }
    }

    if (user.role === "lecturer" && lecturer) {
      if (!isValidLecturerCode(lecturer.lecturer_code)) {
        return NextResponse.json({ error: "Mã giảng viên không hợp lệ." }, { status: 400 });
      }
    }

    //  Nếu qua hết kiểm tra → gọi repository
    const result = await userRepo.createUserWithRole({
      user,
      student,
      parents,
      parent,
      lecturer,
      student_parent,
    });

    const createdUsers: { id: number; role: string }[] = result;

    // Ghi log tạo user
    try {
      await logUserChange({
        user_id: createdUsers[0]?.id ?? null,
        changed_by: authUser.id,
        change_type: "create_user",
        changes: {
          created_at: new Date().toISOString(),
          description: `Admin ${authUser.id} đã tạo người dùng mới với role '${user.role}'`,
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Ghi log thất bại:", logErr);
    }

    return NextResponse.json(
      {
        message: "Tạo tài khoản thành công!",
        users: createdUsers.map((u) => ({
          id: u.id,
          role: u.role,
        })),
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    console.error("Lỗi hệ thống:", e);
    const err = e as { status?: number; message?: string; code?: string; field?: string };
    const status = typeof err?.status === "number"
      ? err.status
      : (err?.message === "No token" || err?.message === "Invalid token")
        ? 401
        : 500;

    if (status === 401) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status }
      );
    }

    return NextResponse.json(
      {
        error: err?.message ?? "Lỗi hệ thống.",
        code: err?.code || (status === 409 ? "DUPLICATE" : "UNKNOWN"),
        field: err?.field,
      },
      { status }
    );
  }
}



// ĐỪng xoá phần dưới đây /-----------------------
  
// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { UserRepository } from "@packages/data/repositories/UserRepository";
// import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
// import {
//   isValidEmail,
//   isValidPhone,
//   isValidFullName,
//   isValidCitizenId,
//   isValidAddress,
//   isValidEthnic,
//   isValidStudentCode,
//   isValidLecturerCode,
//   isValidOccupation,
//   isValidAcademicYear,
//   isValidPlaceOrContactAddress,
// } from "@/lib/regex";

// const userRepo = new UserRepository();

// /**
//  * POST /api/users/admin/create
//  * Yêu cầu quyền admin
//  * Body:
//  * {
//  *   user: { full_name, role, email, phone, ... },
//  *   student?: { student_code, class_id, ... },
//  *   parents?: [
//  *     {
//  *       user: { full_name, email, phone, ... },
//  *       parent: { occupation },
//  *       relationship: "father" | "mother" | "guardian"
//  *     }
//  *   ],
//  *   parent?: { occupation },
//  *   student_parent?: { student_id, relationship },
//  *   lecturer?: { lecturer_code, faculty_id, ... }
//  * }
//  */
// export async function POST(req: NextRequest) {
//   try {
//     const authUser = authenticate(req);
//     if (!authUser || authUser.role !== "admin") {
//       return NextResponse.json(
//         { error: "Bạn không có quyền thực hiện hành động này." },
//         { status: 403 }
//       );
//     }

//     const body = await req.json();
//     const { user, student, parents, parent, lecturer, student_parent } = body;

//     if (!user?.full_name || !user?.role) {
//       return NextResponse.json(
//         { error: "Thiếu thông tin user hoặc role." },
//         { status: 400 }
//       );
//     }

//     // ⚙️ Kiểm tra logic theo role
//     if (user.role === "parent" && !parent) {
//       return NextResponse.json(
//         { error: "Thiếu thông tin parent khi tạo phụ huynh." },
//         { status: 400 }
//       );
//     }

//     if (user.role === "parent" && !student_parent) {
//       return NextResponse.json(
//         { error: "Phụ huynh phải được liên kết với ít nhất một học sinh (student_parent)." },
//         { status: 400 }
//       );
//     }

//     if (user.role === "student" && parents && !Array.isArray(parents)) {
//       return NextResponse.json(
//         { error: "parents phải là một mảng." },
//         { status: 400 }
//       );
//     }

//     // 🧠 Gọi repository để tạo tài khoản
//     const result = await userRepo.createUserWithRole({
//       user,
//       student,
//       parents,
//       parent,
//       lecturer,
//       student_parent,
//     });

//     // Ép kiểu mảng user được trả về
//     const createdUsers = Array.isArray(result)
//       ? (result as { id: number; role: string }[])
//       : [{ id: (result as any).id, role: (result as any).role }];

//     // 🪵 Ghi log (lấy id user đầu tiên)
//     try {
//       await logUserChange({
//         user_id: createdUsers[0]?.id ?? null,
//         changed_by: authUser.id,
//         change_type: "create_user",
//         changes: {
//           created_at: new Date().toISOString(),
//           description: `Admin ${authUser.id} đã tạo người dùng mới với role '${user.role}'`,
//         },
//       });
//     } catch (logErr) {
//       console.warn("⚠️ Ghi log thất bại:", logErr);
//     }

//     // ✅ Trả về kết quả thống nhất
//     return NextResponse.json(
//       {
//         message: "Tạo tài khoản thành công!",
//         users: createdUsers.map((u) => ({
//           id: u.id,
//           role: u.role,
//         })),
//       },
//       { status: 201 }
//     );
//   } catch (e: unknown) {
//     console.error("❌ Lỗi hệ thống:", e);
//     const err = e as { status?: number; message?: string; code?: string; field?: string };
//     const status = typeof err?.status === "number" ? err.status : 500;

//     return NextResponse.json(
//       {
//         error: err?.message ?? "Lỗi hệ thống.",
//         code: err?.code || (status === 409 ? "DUPLICATE" : "UNKNOWN"),
//         field: err?.field,
//       },
//       { status }
//     );
//   }
// }

