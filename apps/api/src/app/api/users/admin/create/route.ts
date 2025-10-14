// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { UserRepository } from "@packages/data/repositories/UserRepository";
// import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";

// const userRepo = new UserRepository();

// /**
//  *  POST /api/users/admin/create
//  * Yêu cầu quyền admin
//  * Body:
//  * {
//  *   user: { full_name, role, email, phone, ... },
//  *   student?: { student_code, class_id, ... },
//  *   parent?: { occupation },
//  *   lecturer?: { lecturer_code, faculty_id, ... }
//  * }
//  */
// export async function POST(req: NextRequest) {
//   try {

//     const authUser = authenticate(req);
//     if (!authUser || authUser.role !== "admin") {
//       return NextResponse.json({ error: "Bạn không có quyền thực hiện hành động này." }, { status: 403 });
//     }

//     const body = await req.json();
//     const { user, student, parent, lecturer } = body;

//     if (!user || !user.full_name || !user.role) {
//       return NextResponse.json({ error: "Thiếu thông tin user hoặc role." }, { status: 400 });
//     }

//     const newUser = await userRepo.createUserWithRole({
//       user,
//       student,
//       parent,
//       lecturer,
//     });

//     try {
//       await logUserChange({
//         user_id: newUser.id,
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

//     return NextResponse.json(
//       {
//         message: "Tạo tài khoản thành công!",
//         user: newUser,
//       },
//       { status: 201 }
//     );
//   } catch (e: any) {
//     console.error("Lỗi hệ thống:", e);
//     return NextResponse.json({ error: e.message ?? "Lỗi hệ thống." }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";

const userRepo = new UserRepository();

/**
 *  POST /api/users/admin/create
 *  Yêu cầu quyền admin
 *  Body:
 *  {
 *    user: { full_name, role, email, phone, ... },
 *    student?: { student_code, class_id, ... },
 *    parent?: { occupation },
 *    lecturer?: { lecturer_code, faculty_id, ... },
 *    student_parent?: { student_id, relationship }  // ✅ Thêm dòng này
 *  }
 */
export async function POST(req: NextRequest) {
  try {
    // ✅ Kiểm tra quyền
    const authUser = authenticate(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này." },
        { status: 403 }
      );
    }

    // ✅ Lấy body
    const body = await req.json();
    const { user, student, parent, lecturer, student_parent } = body;

    // ✅ Kiểm tra đầu vào
    if (!user || !user.full_name || !user.role) {
      return NextResponse.json(
        { error: "Thiếu thông tin user hoặc role." },
        { status: 400 }
      );
    }

    // ✅ Nếu là phụ huynh mà thiếu liên kết học sinh → báo lỗi
    if (user.role === "parent" && !student_parent) {
      return NextResponse.json(
        { error: "Phụ huynh phải được liên kết với ít nhất một học sinh (student_parent)." },
        { status: 400 }
      );
    }

    // ✅ Gọi repository xử lý
    const newUser = await userRepo.createUserWithRole({
      user,
      student,
      parent,
      lecturer,
      student_parent, // ✅ Truyền thêm vào
    });

    // ✅ Ghi log
    try {
      await logUserChange({
        user_id: newUser.id,
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
        user: newUser,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Lỗi hệ thống:", e);
    return NextResponse.json(
      { error: e.message ?? "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
