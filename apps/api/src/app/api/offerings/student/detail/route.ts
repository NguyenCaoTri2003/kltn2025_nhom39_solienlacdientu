import { NextRequest, NextResponse } from "next/server"
import { StudentRepository } from "@packages/data/repositories/StudentRepository"
import { GradeRepository } from "@packages/data/repositories/GradeRepository"
import { StudentUseCase } from "@packages/core/usecases/StudentUseCase"
import { authenticate } from "@packages/utils/auth"

const studentRepo = new StudentRepository()
const gradeRepo = new GradeRepository()
const studentUseCase = new StudentUseCase(studentRepo, gradeRepo)

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req)
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const offeringId = Number(searchParams.get("offering_id"))
    const studentId = Number(searchParams.get("student_id"))

    if (!offeringId || !studentId) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing offering_id or student_id", data: null },
        { status: 400 }
      )
    }

    const result = await studentUseCase.getStudentDetailForLecturer(
      user.id,
      offeringId,
      studentId
    )

    const status =
      result.returnCode === 0
        ? 200
        : result.message.includes("quyền")
        ? 403
        : 404

    return NextResponse.json(result, { status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[GET /student/detail]", message)

    return NextResponse.json(
      { returnCode: 1, message, data: null },
      { status: 500 }
    )
  }
}
