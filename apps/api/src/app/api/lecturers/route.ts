import { NextRequest, NextResponse } from "next/server";
import { getLecturersBySemester } from "@/core/usecases/LecturerUseCase";

// http://localhost:3000/api/lecturers?semester_id=1

export async function GET(req: NextRequest) {
  try {
    console.log("API called: /api/lecturers");
    
    const { searchParams } = new URL(req.url);
    const semesterId = Number(searchParams.get("semester_id"));
    
    console.log("Semester ID:", semesterId);
    
    if (!semesterId || isNaN(semesterId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing or invalid semester_id parameter", data: null },
        { status: 400 }
      );
    }

    console.log("Calling getLecturersBySemester with ID:", semesterId);
    const lecturers = await getLecturersBySemester(semesterId);
    console.log("Lecturers result:", lecturers);

    if (!lecturers || (Array.isArray(lecturers) && lecturers.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "No lecturers found for this semester", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: lecturers 
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
