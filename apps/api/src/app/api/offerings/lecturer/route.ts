import { NextRequest, NextResponse } from "next/server";
import { getOfferingsByLecturer } from "@/core/usecases/OfferingsUseCase";
import { authenticate } from "@/utils/auth";

// http://localhost:3000/api/offerings/lecturer

export async function GET(req: NextRequest) {
  try {
    // Xác thực người dùng
    const user = authenticate(req);
    
    // Kiểm tra quyền truy cập - chỉ cho phép lecturer và admin
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    // Lấy danh sách lớp học phần của giảng viên hiện tại
    const offerings = await getOfferingsByLecturer(user.id);

    if (!offerings || (Array.isArray(offerings) && offerings.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "No course offerings found for this lecturer", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: offerings 
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { returnCode: 1, message: err.message, data: null },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { returnCode: 1, message: "Unknown error", data: null },
      { status: 500 }
    );
  }
}
