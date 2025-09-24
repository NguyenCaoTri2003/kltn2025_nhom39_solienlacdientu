import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/data/repositories/UserRepository';
import { authenticate } from "@/utils/auth";

const repo = new UserRepository();

export async function GET(req: NextRequest, { params }: { params: { id: number } }) {
  try {
    const userPayload = authenticate(req);

    if (userPayload.id !== params.id && userPayload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const user = await repo.findById(params.id);
    return new Response(JSON.stringify(user));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: number } }) {
  try {
    const payload = authenticate(req); 

    if (payload.id !== params.id && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = await req.json(); 

    const user = await repo.updateUserFull(params.id, updates);

    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Invalid token" ? 401 : 400 });
  }
}