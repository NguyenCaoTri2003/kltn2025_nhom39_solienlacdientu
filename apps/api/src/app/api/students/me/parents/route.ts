import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
  isValidOccupation,
} from "@packages/utils/Regex";

const userRepo = new UserRepository();

/**
 * POST /api/students/me/parents
 * Cho phép sinh viên tự thêm phụ huynh vào tài khoản của mình
 * - Student only
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

    // Chỉ cho phép student
    if (authUser.role !== "student") {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Student only", data: null },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      full_name, 
      email, 
      phone, 
      citizen_id_card, 
      address, 
      ethnic, 
      occupation, 
      relationship 
    } = body;

    // Validate các trường bắt buộc
    if (!full_name || !isValidFullName(full_name)) {
      return NextResponse.json(
        { error: "Họ tên không hợp lệ (1–128 ký tự)." },
        { status: 400 }
      );
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ." },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email không hợp lệ." },
        { status: 400 }
      );
    }

    if (citizen_id_card && !isValidCitizenId(citizen_id_card)) {
      return NextResponse.json(
        { error: "CCCD/CMND không hợp lệ." },
        { status: 400 }
      );
    }

    if (address && !isValidAddress(address)) {
      return NextResponse.json(
        { error: "Địa chỉ không hợp lệ." },
        { status: 400 }
      );
    }

    if (ethnic && !isValidEthnic(ethnic)) {
      return NextResponse.json(
        { error: "Dân tộc không hợp lệ." },
        { status: 400 }
      );
    }

    if (occupation && !isValidOccupation(occupation)) {
      return NextResponse.json(
        { error: "Nghề nghiệp không hợp lệ." },
        { status: 400 }
      );
    }

    if (!relationship || !["father", "mother", "guardian"].includes(relationship)) {
      return NextResponse.json(
        { error: "Quan hệ không hợp lệ. Phải là: father, mother, hoặc guardian." },
        { status: 400 }
      );
    }

    const studentId = authUser.id;

    // Sử dụng method từ UserRepository để thêm phụ huynh
    try {
      const result = await userRepo.addParentToStudent(studentId, {
        user: {
          full_name,
          email: email || undefined,
          phone,
          citizen_id_card: citizen_id_card || undefined,
          address: address || undefined,
          ethnic: ethnic || undefined,
        },
        parent: {
          occupation: occupation || undefined,
        },
        relationship,
      });

      return NextResponse.json(
        {
          message: result.is_new
            ? "Đã tạo mới và liên kết phụ huynh với tài khoản của bạn thành công."
            : "Đã liên kết phụ huynh với tài khoản của bạn thành công.",
          parent_id: result.parent_id,
          relationship,
          is_new: result.is_new,
        },
        { status: 201 }
      );
    } catch (repoError: unknown) {
      // Xử lý lỗi từ repository
      const error = repoError as { status?: number; message?: string; code?: string; field?: string };
      if (error.status) {
        return NextResponse.json(
          {
            error: error.message || "Lỗi khi thêm phụ huynh.",
            code: error.code,
            field: error.field,
          },
          { status: error.status }
        );
      }
      throw repoError;
    }
  } catch (e: unknown) {
    console.error("Lỗi hệ thống:", e);
    const err = e as { status?: number; message?: string; code?: string };
    const status = typeof err?.status === "number" ? err.status : 500;

    return NextResponse.json(
      {
        error: err?.message ?? "Lỗi hệ thống.",
        code: err?.code || (status === 409 ? "DUPLICATE" : "UNKNOWN"),
      },
      { status }
    );
  }
}

