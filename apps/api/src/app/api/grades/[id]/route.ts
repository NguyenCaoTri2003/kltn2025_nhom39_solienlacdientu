import { NextResponse } from "next/server";
import { getGrades } from  '../../../../../../../packages/core/usecases/getGrades';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const grades = await getGrades(params.id);
    return NextResponse.json(grades);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
