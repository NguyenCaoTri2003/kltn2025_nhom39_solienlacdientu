import { NextRequest } from 'next/server';
import { UserRepository } from '@packages/data/repositories/UserRepository';
import { authenticate } from "@packages/utils/auth";

const repo = new UserRepository();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userPayload = await authenticate(req);

    if (userPayload.id !== Number(id) && userPayload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const user = await repo.getUserFullDetail(Number(id));
    return new Response(JSON.stringify(user));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 401 });
  }
}


