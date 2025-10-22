import { NextResponse } from "next/server";
import { getSemesters } from "@packages/core/usecases/SemestersUseCase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromYear = searchParams.get("fromYear")
      ? Number(searchParams.get("fromYear"))
      : undefined;

    const semesters = await getSemesters(fromYear);

    if (!semesters || semesters.length === 0) {
      return createResponse(
        { returnCode: 1, message: "Semesters not found", data: null },
        404
      );
    }

    return createResponse({ returnCode: 0, message: "OK", data: semesters });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return createResponse({ returnCode: 1, message, data: null }, 500);
  }
}

export async function OPTIONS() {
  return createResponse({}, 200);
}

// Helper để set CORS
function createResponse(body: any, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
