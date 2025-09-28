import { NextRequest, NextResponse } from "next/server";
import { getStudentsByOffering } from "@/core/usecases/EnrollmentUseCase";

// http://localhost:3000/api/students?offering_id=1

export async function GET(req: NextRequest) {
  try {
    console.log("API called: /api/students");
    
    const { searchParams } = new URL(req.url);
    const offeringId = Number(searchParams.get("offering_id"));
    
    console.log("Offering ID:", offeringId);
    
    if (!offeringId || isNaN(offeringId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing or invalid offering_id parameter", data: null },
        { status: 400 }
      );
    }

    console.log("Calling getStudentsByOffering with ID:", offeringId);
    const students = await getStudentsByOffering(offeringId);
    console.log("Students result:", students);

    if (!students || (Array.isArray(students) && students.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "No students found for this course offering", data: null },
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
