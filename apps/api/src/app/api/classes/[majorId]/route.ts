import { NextRequest, NextResponse } from "next/server";
import { ClassesUseCase } from "@packages/core/usecases/ClassesUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new ClassesUseCase();

// http://localhost:3000/api/classes/[majorId]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ majorId: string }> | { majorId: string } }
) {
  try {
    const user = await authenticate(req);
    const resolvedParams = await Promise.resolve(params);
    const majorId = Number(resolvedParams.majorId);
    const classesList = await usecase.getClassesByMajor(majorId, user);

    if (!classesList || (Array.isArray(classesList) && classesList.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Classes not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: classesList });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isUnauthorized = message === "No token" || message === "Invalid token";
    const status = message === "You do not have access!" ? 403 : isUnauthorized ? 401 : 500;
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status }
    );
  }
}


