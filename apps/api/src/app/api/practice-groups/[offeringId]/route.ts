import { NextResponse } from "next/server";
import { getGroupsByOffering } from "../../../../../../../packages/core/usecases/PracticeGroupUseCase";

// http://localhost:3000/api/practice-groups/[offeringId]

export async function GET(
  req: Request,
  { params }: { params: { offeringId: string } }
) {
  try {
    const offeringId = Number(params.offeringId);
    const groups = await getGroupsByOffering(offeringId);

    if (!groups || (Array.isArray(groups) && groups.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Practice groups not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: groups });
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


