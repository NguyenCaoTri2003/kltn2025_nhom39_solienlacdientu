import { NextResponse } from "next/server";
import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new MessageUseCase();

export async function GET(req: Request) {
  try {
    const user = await authenticate(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const otherUserIdParam = searchParams.get("otherUserId");
    if (!otherUserIdParam)
      return NextResponse.json(
        { error: "Missing otherUserId" },
        { status: 400 }
      );

    const otherUserId = Number(otherUserIdParam);
    const userId = user.id;

    const conversation = await usecase.getConversationWith(userId, otherUserId);

    if (!conversation)
      return NextResponse.json({ message: "not found" }, { status: 404 });

    return NextResponse.json(conversation);
  } catch (err: any) {
    console.error("GET /api/conversations/with error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
