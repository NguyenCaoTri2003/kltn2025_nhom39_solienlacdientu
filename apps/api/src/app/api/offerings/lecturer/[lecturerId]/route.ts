import { NextRequest, NextResponse } from "next/server";
import { getOfferingsByLecturer } from "@/core/usecases/OfferingsUseCase";
import { authenticate } from "@/utils/auth";

// http://localhost:3000/api/offerings/lecturer/[lecturerId]

export async function GET(
  req: NextRequest,
  { params }: { params: { lecturerId: string } }
) {
  try {
    // Xác thực người dùng
    const user = authenticate(req);
    
    // Kiểm tra quyền truy cập - chỉ cho phép lecturer, admin hoặc chính giảng viên đó
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    // Nếu là lecturer, chỉ cho phép xem lớp học phần của chính mình
    if (user.role === "lecturer" && user.id !== Number(params.lecturerId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    const lecturerId = Number(params.lecturerId);
    
    if (isNaN(lecturerId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Invalid lecturer ID", data: null },
        { status: 400 }
      );
    }

    const offerings = await getOfferingsByLecturer(lecturerId);

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
