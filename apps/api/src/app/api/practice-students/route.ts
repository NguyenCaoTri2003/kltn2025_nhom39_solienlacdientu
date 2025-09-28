import { NextRequest, NextResponse } from "next/server";
import { getStudentsByPracticeGroup } from "@/core/usecases/EnrollmentUseCase";

// http://localhost:3000/api/practice-students?group_id=1

export async function GET(req: NextRequest) {
  try {
    console.log("API called: /api/practice-students");
    
    const { searchParams } = new URL(req.url);
    const groupId = Number(searchParams.get("group_id"));
    
    console.log("Practice Group ID:", groupId);
    
    if (!groupId || isNaN(groupId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing or invalid group_id parameter", data: null },
        { status: 400 }
      );
    }

    console.log("Calling getStudentsByPracticeGroup with ID:", groupId);
    const students = await getStudentsByPracticeGroup(groupId);
    console.log("Practice students result:", students);

    if (!students || (Array.isArray(students) && students.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "No students found for this practice group", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: students 
    });
  } catch (err: unknown) {
    console.error("API Error:", err);
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
