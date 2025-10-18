import { NextResponse } from "next/server";
import { getSemesters } from "@packages/core/usecases/getSemesters";

// http://localhost:3000/api/semesters

export async function GET() {
  try {
    const semesters = await getSemesters();

    if (!semesters || (Array.isArray(semesters) && semesters.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Semesters not found", data: null },
        { status: 404 }
      );
    }

    const res = NextResponse.json({ returnCode: 0, message: "OK", data: semesters });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      const res = NextResponse.json(
        { returnCode: 1, message: err.message, data: null },
        { status: 500 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }
    const res = NextResponse.json(
      { returnCode: 1, message: "Unknown error", data: null },
      { status: 500 }
    );
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}


