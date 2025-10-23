import { NextResponse } from "next/server";
import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new MessageUseCase();

export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversationId } = body;
  if (!conversationId)
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

  await usecase.markAsRead(conversationId, user.id);
  return NextResponse.json({ success: true });
}
