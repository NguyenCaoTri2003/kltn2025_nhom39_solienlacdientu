import { NextResponse } from "next/server";
import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new MessageUseCase();

export async function GET(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = Number(searchParams.get("conversationId"));
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const data = await usecase.getConversationMessages(conversationId, user.id);
  console.log("GET messages data:", data);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { receiverId, content, type } = body;

  if (!receiverId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await usecase.startConversation(user.id, receiverId, content, type ?? "text");
  return NextResponse.json(result.message);
}