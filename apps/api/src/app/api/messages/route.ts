// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { MessageRepository } from '@packages/data/repositories/MessageRepository';
// import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";

// const usecase = new MessageUseCase(new MessageRepository());

// export async function POST(req: NextRequest) {
//   try {
//     const user = authenticate(req);
//     const body = await req.json();
//     const { receiverId, content } = body;

//     if (!content) {
//       return NextResponse.json({ error: "Missing content" }, { status: 400 });
//     }

//     const result = await usecase.sendMessage(user, receiverId, content);
//     return NextResponse.json(result, { status: 201 });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 400 });
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     const user = authenticate(req);
//     const { searchParams } = new URL(req.url);

//     const otherUserId = searchParams.get("otherUserId")
//       ? Number(searchParams.get("otherUserId"))
//       : undefined;

//     if (otherUserId) {
//       const conv = await usecase.getConversation(user, otherUserId);
//       return NextResponse.json(conv);
//     } else {
//       const inbox = await usecase.getInbox(user);
//       return NextResponse.json(inbox);
//     }
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 400 });
//   }
// }

import { NextResponse } from "next/server";
import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new MessageUseCase();

export async function GET(req: Request) {
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = Number(searchParams.get("conversationId"));
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const data = await usecase.getConversationMessages(conversationId, user.id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { receiverId, content, type } = body;

  if (!receiverId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await usecase.startConversation(user.id, receiverId, content, type ?? "text");
  return NextResponse.json(result.message);
}