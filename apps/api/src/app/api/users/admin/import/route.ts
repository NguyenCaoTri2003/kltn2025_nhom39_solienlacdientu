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

// Helper to safely get first non-empty value among candidate headers.
// function getCell(row: Record<string, unknown>, ...candidates: string[]): unknown {
//   for (const key of candidates) {
//     if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
//       return row[key];
//     }
//     // Try with Excel duplicate-key suffixes (e.g., "_1", "_2")
//     const alt1 = `${key}_1`;
//     const alt2 = `${key}_2`;
//     if (row[alt1] !== undefined && row[alt1] !== null && String(row[alt1]).trim() !== "") {
//       return row[alt1];
//     }
//     if (row[alt2] !== undefined && row[alt2] !== null && String(row[alt2]).trim() !== "") {
//       return row[alt2];
//     }
//   }
//   return undefined;
// }

function getCell(row: Record<string, unknown>, ...candidates: string[]): unknown {
  for (const key of candidates) {
    // --- 1️⃣ Khớp chính xác trước ---
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }

    // --- 2️⃣ Thử với Excel duplicate-key suffixes (e.g., "_1", "_2") ---
    const alt1 = `${key}_1`;
    const alt2 = `${key}_2`;
    if (row[alt1] !== undefined && row[alt1] !== null && String(row[alt1]).trim() !== "") {
      return row[alt1];
    }
    if (row[alt2] !== undefined && row[alt2] !== null && String(row[alt2]).trim() !== "") {
      return row[alt2];
    }

    // --- 3️⃣ Thử tìm gần giống (fuzzy match) ---
    const foundKey = Object.keys(row).find(
      (k) =>
        k.replace(/\s+/g, " ").toLowerCase().includes(key.toLowerCase().trim()) &&
        row[k] !== undefined &&
        row[k] !== null &&
        String(row[k]).trim() !== ""
    );
    if (foundKey) {
      return row[foundKey];
    }
  }

  return undefined;
}


function parseRelationship(value: unknown): "father" | "mother" | "guardian" | undefined {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  if (!v) return undefined;

  //  Số mapping
  if (v === "1") return "father";
  if (v === "2") return "mother";
  if (v === "3") return "guardian";

  //  Tiếng Anh common variants
  if (v === "father" || v.includes("dad") || v.includes("father")) return "father";
  if (v === "mother" || v.includes("mom") || v.includes("mother")) return "mother";
  if (v === "guardian" || v.includes("guardian") || v.includes("caregiver")) return "guardian";

  //  Tiếng Việt common variants
  if (v.includes("cha") || v.includes("bố") || v.includes("ba") || v.includes("phụ thân")) return "father";
  if (v.includes("mẹ") || v.includes("má") || v.includes("mẫu thân")) return "mother";
  if (
    v.includes("giám hộ") ||
    v.includes("người nuôi") ||
    v.includes("ông") ||
    v.includes("bà") ||
    v.includes("chú") ||
    v.includes("cô") ||
    v.includes("dì") ||
    v.includes("bác")
  )
    return "guardian";

  // fallback + log cảnh báo
  console.warn(`⚠️ Unknown relationship value: "${v}"`);
  return "guardian";
}

function parseLevelOfTraining(value: unknown): "bachelor" | "master" | "phd" | undefined {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  if (!v) return undefined;

  //  Số mapping
  if (v === "1") return "bachelor";
  if (v === "2") return "master";
  if (v === "3") return "phd";

  // English
  if (v.includes("bachelor") || v.includes("undergraduate")) return "bachelor";
  if (v.includes("master") || v.includes("graduate")) return "master";
  if (v.includes("phd") || v.includes("doctor") || v.includes("doctoral")) return "phd";

  // Tiếng Việt
  if (v.includes("đại học") || v.includes("cử nhân")) return "bachelor";
  if (v.includes("thạc sĩ")) return "master";
  if (v.includes("tiến sĩ") || v.includes("nghiên cứu sinh")) return "phd";

  console.warn(`⚠️ Unknown levelOfTraining value: "${v}"`);
  return undefined;
}

function parseTypeOfTraining(value: unknown): "regular" | "advanced" | undefined {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  if (!v) return undefined;

  // Số mapping
  if (v === "1") return "regular";
  if (v === "2") return "advanced";

  // English
  if (v.includes("regular") || v.includes("standard")) return "regular";
  if (v.includes("advanced") || v.includes("high quality") || v.includes("international")) return "advanced";

  // Tiếng Việt
  if (v.includes("chính quy") || v.includes("chuẩn")) return "regular";
  if (v.includes("chất lượng cao") || v.includes("tiên tiến") || v.includes("đặc biệt")) return "advanced";

  console.warn(`⚠️ Unknown typeOfTraining value: "${v}"`);
  return undefined;
}



export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate(req);
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

    // Map tiêu đề tiếng Việt → field DB, hỗ trợ file student mới có phụ huynh 1 & 2
    const mapKeys = (row: Record<string, unknown>) => ({
      // Base user (student row)
      full_name: getCell(row, "Họ và tên*", "Họ và tên", "Tên"),
      email: getCell(row, "Email", "E-mail"),
      phone: getCell(row, "Số điện thoại*", "Điện thoại"),
      citizen_id_card: getCell(row, "CCCD*", "CCCD", "CMND"),
      address: getCell(row, "Địa chỉ"),
      ethnic: getCell(row, "Dân tộc"),

      // Student specific
      student_code: getCell(row, "Mã sinh viên", "Mã sinh viên*"),
      class_id: getCell(row, "Mã lớp", "Lớp"),
      date_of_birth: normalizeDate(getCell(row, "Ngày sinh")),
      place_of_birth: getCell(row, "Nơi sinh"),
      contact_address: getCell(row, "Địa chỉ liên lạc"),
      type_of_training: getCell(row, "Hình thức đào tạo"),
      training_level: getCell(row, "Trình độ đào tạo"),
      academic_year: getCell(row, "Niên khóa"),

      // Parent 1 (optional)
      p1_full_name: getCell(row, "Họ tên phụ huynh 1", "Họ tên PH 1"),
      p1_email: getCell(row, "Email phụ huynh 1", "Email PH 1"),
      p1_phone: getCell(row, "Số điện thoại phụ huynh 1", "Điện thoại phụ huynh 1", "SĐT phụ huynh 1"),
      p1_citizen_id_card: getCell(row, "CCCD phụ huynh 1", "CMND phụ huynh 1"),
      p1_address: getCell(row, "Địa chỉ phụ huynh 1"),
      p1_ethnic: getCell(row, "Dân tộc phụ huynh 1", "Dân tộc PH1", "Dân tộc 1"),
      p1_occupation: getCell(row, "Nghề nghiệp phụ huynh 1", "Nghề nghiệp PH 1"),
      p1_relationship: getCell(row, "Mối quan hệ với PH1", "Mối quan hệ", "Relationship"),

      // Parent 2 (optional)
      p2_full_name: getCell(row, "Họ tên phụ huynh 2", "Họ tên PH 2"),
      p2_email: getCell(row, "Email phụ huynh 2", "Email PH 2"),
      p2_phone: getCell(row, "Số điện thoại phụ huynh 2", "Điện thoại phụ huynh 2", "SĐT phụ huynh 2"),
      p2_citizen_id_card: getCell(row, "CCCD phụ huynh 2", "CMND phụ huynh 2"),
      p2_address: getCell(row, "Địa chỉ phụ huynh 2"),
      p2_ethnic: getCell(row, "Dân tộc phụ huynh 2", "Dân tộc PH2", "Dân tộc 2"),
      p2_occupation: getCell(row, "Nghề nghiệp phụ huynh 2", "Nghề nghiệp PH 2"), 
      p2_relationship: getCell(row, "Mối quan hệ với PH2", "Relationship"),

      // For separate parent import rows (role = parent)
      occupation: getCell(row, "Nghề nghiệp"),
      student_id: getCell(row, "Mã sinh viên con*", "ID sinh viên con*", "Student ID"),
      relationship: getCell(row, "Mối quan hệ", "Mối quan hệ*", "Relationship"),

      // Lecturer
      lecturer_code: getCell(row, "Mã giảng viên", "Mã giảng viên*"),
      faculty_id: getCell(row, "Mã khoa"),
      academic_rank: getCell(row, "Học hàm", "Học hàm*"),
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
        let parents: {
          user: {
            full_name?: string;
            email?: string;
            phone?: string;
            citizen_id_card?: string;
            address?: string;
            ethnic?: string;
            role?: "parent";
          };
          parent: { occupation?: string };
          relationship: "father" | "mother" | "guardian";
        }[] | undefined;
        let lecturer: { lecturer_code?: string; faculty_id?: number; academic_rank?: string } | undefined;
        let student_parent: { student_id: number; relationship: "father" | "mother" | "guardian" } | undefined;

        if (role === "student") {
          student = {
            student_code: toStr(row.student_code),
            class_id: row.class_id ? Number(row.class_id) : undefined,
            date_of_birth: row.date_of_birth ? String(row.date_of_birth) : undefined,
            place_of_birth: toStr(row.place_of_birth),
            contact_address: toStr(row.contact_address),
            type_of_training: parseTypeOfTraining(row.type_of_training) || "regular",
            training_level: parseLevelOfTraining(row.training_level) || "bachelor",
            academic_year: toStr(row.academic_year),
          };

          // Optional parents 1 & 2 in the same student row
          const pArr: typeof parents = [];
          const p1_hasAny =
            toStr(row.p1_full_name) ||
            toStr(row.p1_email) ||
            toStr(row.p1_phone) ||
            toStr(row.p1_citizen_id_card);
          if (p1_hasAny) {
            pArr.push({
              user: {
                full_name: toStr(row.p1_full_name),
                email: toStr(row.p1_email),
                phone: toStr(row.p1_phone),
                citizen_id_card: toStr(row.p1_citizen_id_card),
                address: toStr(row.p1_address),
                ethnic: toStr(row.p1_ethnic),
                role: "parent",
              },
              parent: { occupation: toStr(row.p1_occupation) },
              relationship: parseRelationship(row.p1_relationship) || "guardian",
            });
          }

          const p2_hasAny =
            toStr(row.p2_full_name) ||
            toStr(row.p2_email) ||
            toStr(row.p2_phone) ||
            toStr(row.p2_citizen_id_card);
          if (p2_hasAny) {
            pArr.push({
              user: {
                full_name: toStr(row.p2_full_name),
                email: toStr(row.p2_email),
                phone: toStr(row.p2_phone),
                citizen_id_card: toStr(row.p2_citizen_id_card),
                address: toStr(row.p2_address),
                ethnic: toStr(row.p2_ethnic),
                role: "parent",
              },
              parent: { occupation: toStr(row.p2_occupation) },
              relationship: parseRelationship(row.p2_relationship) || "guardian",
            });
          }
          if (pArr.length) parents = pArr;
        } 
        else if (role === "parent") {
          parent = { occupation: toStr(row.occupation) };
          const rel: "father" | "mother" | "guardian" = parseRelationship(row.relationship) || "guardian";
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

        const createdUsers = await userRepo.createUserWithRole({
          user,
          student,
          parents,
          parent,
          lecturer,
          student_parent, 
        });

        // Ghi log cho user chính (theo role được import)
        const main = (createdUsers || []).find((u) => u.role === role) || createdUsers[0];
        if (main) {
          await logUserChange({
            user_id: main.id,
          changed_by: authUser.id,
          change_type: "create_user",
          changes: {
            created_at: new Date().toISOString(),
              description: `Import: admin ${authUser.id} đã tạo user '${user.full_name}' (${role})`,
          },
          });
        }

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
