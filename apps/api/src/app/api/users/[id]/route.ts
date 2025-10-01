import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@packages/data/repositories/UserRepository';
import { authenticate } from "@packages/utils/auth";

const repo = new UserRepository();

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params; 
    const userPayload = authenticate(req);

    if (userPayload.id !== Number(id) && userPayload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const user = await repo.findById(Number(id));
    return new Response(JSON.stringify(user));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params; 
    const payload = authenticate(req); 

    if (payload.id !== Number(id) && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = await req.json(); 
    const user = await repo.updateUserFull(Number(id), updates);

    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Invalid token" ? 401 : 400 });
  }
}
