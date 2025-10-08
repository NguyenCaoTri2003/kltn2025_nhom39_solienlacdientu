import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@packages/core/usecases/UsersUseCase"
import { authenticate } from "@packages/utils/auth"

// GET http://localhost:3000/api/users
export async function GET(req: NextRequest) {
  try {
    //  Kiểm tra token
    const user = authenticate(req)

    //  Chỉ cho phép admin truy cập
    if (user.role !== "admin") {
      throw new Error("You do not have access!")
    }

    // Lấy danh sách user từ DB
    const users = await getAllUsers()

    if (!users || (Array.isArray(users) && users.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "No users found", data: null },
        { status: 404 }
      )
    }

    //  Trả về kết quả
    return NextResponse.json({ returnCode: 0, message: "OK", data: users })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const isUnauthorized = message === "No token" || message === "Invalid token"
    const status =
      message === "You do not have access!"
        ? 403
        : isUnauthorized
        ? 401
        : 500

    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status }
    )
  }
}
