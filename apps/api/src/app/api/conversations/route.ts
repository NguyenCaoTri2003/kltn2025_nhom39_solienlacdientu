import { NextResponse } from 'next/server'
import { MessageUseCase } from '@packages/core/usecases/MessageUseCase'
import { authenticate } from '@packages/utils/auth'

const usecase = new MessageUseCase()

export async function GET(req: Request) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')
  const userId = userIdParam ? Number(userIdParam) : user.id

  if (user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await usecase.getUserConversations(userId)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { receiverId } = body;

  if (!receiverId) return NextResponse.json({ error: "Missing receiverId" }, { status: 400 });

  const conversation = await usecase.createConversation(user.id, receiverId);
  return NextResponse.json(conversation);
}