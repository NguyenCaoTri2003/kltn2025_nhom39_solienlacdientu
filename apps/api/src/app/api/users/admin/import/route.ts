

// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { UserRepository } from "@packages/data/repositories/UserRepository";
// import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
// import * as XLSX from "xlsx";

// const userRepo = new UserRepository();
// function normalizeDate(value: any): string | null {
//   if (!value) return null;

//   if (typeof value === "number") {
//     const jsDate = XLSX.SSF.parse_date_code(value);
//     if (!jsDate) return null;
//     const yyyy = jsDate.y;
//     const mm = String(jsDate.m).padStart(2, "0");
//     const dd = String(jsDate.d).padStart(2, "0");
//     return `${yyyy}-${mm}-${dd}`;
//   }

//   const dateStr = value.toString().trim();
//   const parsed = new Date(dateStr);
//   if (!isNaN(parsed.getTime())) {
//     return parsed.toISOString().split("T")[0]; 
//   }

//   // Nếu chuỗi dạng dd/MM/yyyy hoặc dd-MM-yyyy
//   const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
//   if (match) {
//     const [_, d, m, y] = match;
//     return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
//   }

//   return null;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const authUser = authenticate(req);
//     if (!authUser || authUser.role !== "admin") {
//       return NextResponse.json(
//         { error: "Bạn không có quyền thực hiện hành động này." },
//         { status: 403 }
//       );
//     }

//     const formData = await req.formData();
//     const file = formData.get("file") as File;
//     const role = formData.get("role") as string;

//     if (!file) {
//       return NextResponse.json({ error: "Thiếu file Excel." }, { status: 400 });
//     }
//     if (!role) {
//       return NextResponse.json({ error: "Thiếu thông tin role." }, { status: 400 });
//     }

//     const buffer = await file.arrayBuffer();
//     const workbook = XLSX.read(buffer, { type: "buffer" });
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows: any[] = XLSX.utils.sheet_to_json(sheet);

//     if (rows.length === 0) {
//       return NextResponse.json({ error: "File Excel không có dữ liệu." }, { status: 400 });
//     }

//     // Map tiêu đề tiếng Việt → field DB
//     const mapKeys = (row: any) => ({
//       full_name: row["Họ và tên*"] || row["Họ và tên"] || row["Tên"],
//       email: row["Email"] || row["E-mail"],
//       phone: row["Số điện thoại*"] || row["Điện thoại"],
//       citizen_id_card: row["CCCD*"] || row["CCCD"] || row["CMND"],
//       address: row["Địa chỉ"],
//       ethnic: row["Dân tộc"],

//       // student
//       student_code: row["Mã sinh viên"] || row["Mã sinh viên*"],
//       class_id: row["Mã lớp"] || row["Lớp"],
//       date_of_birth: normalizeDate(row["Ngày sinh"]),
//       place_of_birth: row["Nơi sinh"],
//       contact_address: row["Địa chỉ liên lạc"],
//       type_of_training: row["Hình thức đào tạo"],
//       training_level: row["Trình độ đào tạo"],
//       academic_year: row["Niên khóa"],

//       // parent
//       occupation: row["Nghề nghiệp"],
//       student_id: row["Mã sinh viên con*"] || row["ID sinh viên con*"] || row["Student ID"], 
//       relationship: row["Mối quan hệ"] || row["Mối quan hệ*"] || row["Relationship"],

//       // lecturer
//       lecturer_code: row["Mã giảng viên"] || row["Mã giảng viên*"],
//       faculty_id: row["Mã khoa"],
//       academic_rank: row["Học hàm"] || row["Học hàm*"],
//     });

//     let successCount = 0;
//     let failCount = 0;
//     const errorRows: { row: number; message: string }[] = [];

//     for (let i = 0; i < rows.length; i++) {
//       const rawRow = rows[i];
//       const row = mapKeys(rawRow);

//       try {
//         const user = {
//           full_name: row.full_name,
//           email: row.email,
//           phone: row.phone,
//           role: role as any,
//           address: row.address ?? null,
//           citizen_id_card: row.citizen_id_card ?? null,
//           ethnic: row.ethnic ?? null,
//         };

//         let student, parent, lecturer, student_parent;

//         if (role === "student") {
//           student = {
//             student_code: row.student_code,
//             class_id: row.class_id,
//             date_of_birth: row.date_of_birth,
//             place_of_birth: row.place_of_birth,
//             contact_address: row.contact_address,
//             type_of_training: row.type_of_training || "regular",
//             training_level: row.training_level,
//             academic_year: row.academic_year,
//           };
//         } 
//         else if (role === "parent") {
//           parent = { occupation: row.occupation };
//           student_parent = {
//             student_id: row.student_id,
//             relationship: row.relationship?.toLowerCase() || "guardian",
//           };
//         } 
//         else if (role === "lecturer") {
//           lecturer = {
//             lecturer_code: row.lecturer_code,
//             faculty_id: row.faculty_id,
//             academic_rank: row.academic_rank,
//           };
//         }

//         const newUser = await userRepo.createUserWithRole({
//           user,
//           student,
//           parent,
//           lecturer,
//           student_parent, 
//         });

//         await logUserChange({
//           user_id: newUser.id,
//           changed_by: authUser.id,
//           change_type: "create_user",
//           changes: {
//             created_at: new Date().toISOString(),
//             description: `Import: admin ${authUser.id} đã tạo user '${user.full_name}' (${role})`,
//           },
//         });

//         successCount++;
//       } catch (err: any) {
//         failCount++;
//         errorRows.push({ row: i + 2, message: err.message || "Lỗi không xác định" });
//       }
//     }

//     return NextResponse.json({
//       message: "Import hoàn tất.",
//       summary: {
//         total: rows.length,
//         success: successCount,
//         failed: failCount,
//         errors: errorRows,
//       },
//     });
//   } catch (e: any) {
//     console.error("❌ Lỗi import:", e);
//     return NextResponse.json(
//       { error: e.message ?? "Lỗi hệ thống khi import." },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
import * as XLSX from "xlsx";

const userRepo = new UserRepository();
function normalizeDate(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === "number") {
    const jsDate = XLSX.SSF.parse_date_code(value);
  if (!jsDate) return undefined;
    const yyyy = jsDate.y;
    const mm = String(jsDate.m).padStart(2, "0");
    const dd = String(jsDate.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const dateStr = value.toString().trim();
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
  return parsed.toISOString().split("T")[0]; 
  }

  // Nếu chuỗi dạng dd/MM/yyyy hoặc dd-MM-yyyy
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = authenticate(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const role = formData.get("role") as string;

    if (!file) {
      return NextResponse.json({ error: "Thiếu file Excel." }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: "Thiếu thông tin role." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Raw row type is loose, keep as Record<string, unknown>
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "File Excel không có dữ liệu." }, { status: 400 });
    }

    // Map tiêu đề tiếng Việt → field DB
    const mapKeys = (row: Record<string, unknown>) => ({
      full_name: row["Họ và tên*"] || row["Họ và tên"] || row["Tên"],
      email: row["Email"] || row["E-mail"],
      phone: row["Số điện thoại*"] || row["Điện thoại"],
      citizen_id_card: row["CCCD*"] || row["CCCD"] || row["CMND"],
      address: row["Địa chỉ"],
      ethnic: row["Dân tộc"],

      // student
      student_code: row["Mã sinh viên"] || row["Mã sinh viên*"],
      class_id: row["Mã lớp"] || row["Lớp"],
      date_of_birth: normalizeDate(row["Ngày sinh"]),
      place_of_birth: row["Nơi sinh"],
      contact_address: row["Địa chỉ liên lạc"],
      type_of_training: row["Hình thức đào tạo"],
      training_level: row["Trình độ đào tạo"],
      academic_year: row["Niên khóa"],

      // parent
      occupation: row["Nghề nghiệp"],
      student_id: row["Mã sinh viên con*"] || row["ID sinh viên con*"] || row["Student ID"], 
      relationship: row["Mối quan hệ"] || row["Mối quan hệ*"] || row["Relationship"],

      // lecturer
      lecturer_code: row["Mã giảng viên"] || row["Mã giảng viên*"],
      faculty_id: row["Mã khoa"],
      academic_rank: row["Học hàm"] || row["Học hàm*"],
    });

    let successCount = 0;
    let failCount = 0;
    const errorRows: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const row = mapKeys(rawRow);

      try {
        const toStr = (v: unknown): string | undefined => {
          if (v === undefined || v === null) return undefined;
          const s = String(v).trim();
            return s.length ? s : undefined;
        };

        const user = {
          full_name: toStr(row.full_name),
          email: toStr(row.email),
          phone: toStr(row.phone),
          role: role as "student" | "lecturer" | "parent" | "admin",
          address: toStr(row.address),
          citizen_id_card: toStr(row.citizen_id_card),
          ethnic: toStr(row.ethnic),
        };

        let student: {
          student_code?: string;
          class_id?: number;
          date_of_birth?: string;
          place_of_birth?: string;
          contact_address?: string;
          type_of_training?: string;
          training_level?: string;
          academic_year?: string;
        } | undefined;
        let parent: { occupation?: string } | undefined;
        let lecturer: { lecturer_code?: string; faculty_id?: number; academic_rank?: string } | undefined;
        let student_parent: { student_id: number; relationship: "father" | "mother" | "guardian" } | undefined;

        if (role === "student") {
          student = {
            student_code: toStr(row.student_code),
            class_id: row.class_id ? Number(row.class_id) : undefined,
            date_of_birth: row.date_of_birth ? String(row.date_of_birth) : undefined,
            place_of_birth: toStr(row.place_of_birth),
            contact_address: toStr(row.contact_address),
            type_of_training: toStr(row.type_of_training) || "regular",
            training_level: toStr(row.training_level),
            academic_year: toStr(row.academic_year),
          };
        } 
        else if (role === "parent") {
          parent = { occupation: toStr(row.occupation) };
          const relRaw = toStr(row.relationship)?.toLowerCase();
          const rel: "father" | "mother" | "guardian" =
            relRaw === "father" || relRaw === "mother" ? relRaw : "guardian";
          const sid = row.student_id ? Number(row.student_id) : NaN;
          if (!Number.isFinite(sid)) throw new Error("student_id không hợp lệ");
          student_parent = { student_id: sid, relationship: rel };
        } 
        else if (role === "lecturer") {
          lecturer = {
            lecturer_code: toStr(row.lecturer_code),
            faculty_id: row.faculty_id ? Number(row.faculty_id) : undefined,
            academic_rank: toStr(row.academic_rank),
          };
        }

        const newUser = await userRepo.createUserWithRole({
          user,
          student,
          parent,
          lecturer,
          student_parent, 
        });

        await logUserChange({
          user_id: newUser.id,
          changed_by: authUser.id,
          change_type: "create_user",
          changes: {
            created_at: new Date().toISOString(),
            description: `Import: admin ${authUser.id} đã tạo user '${user.full_name}' (${role})`,
          },
        });

        successCount++;
      } catch (err) {
        failCount++;
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        errorRows.push({ row: i + 2, message });
      }
    }

    return NextResponse.json({
      message: "Import hoàn tất.",
      summary: {
        total: rows.length,
        success: successCount,
        failed: failCount,
        errors: errorRows,
      },
    });
  } catch (e) {
    console.error("Lỗi import:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi hệ thống khi import." },
      { status: 500 }
    );
  }
}
