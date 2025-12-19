import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@packages/data/repositories/UserRepository';
import { authenticate } from "@packages/utils/auth";
import { canManageAccounts } from "@packages/utils/adminPermissions";

const repo = new UserRepository();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userPayload = await authenticate(req);

    // User can view their own profile, or admin with account management permission
    if (userPayload.id !== Number(id) && !canManageAccounts(userPayload)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const user = await repo.getUserFullDetail(Number(id));
    return new Response(JSON.stringify(user));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userPayload = await authenticate(req);

    // User can update their own profile, or admin with account management permission
    if (userPayload.id !== Number(id) && !canManageAccounts(userPayload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = await req.json();
    const userFullDetail = await repo.updateUserFull(Number(id), updates);

    return NextResponse.json(userFullDetail);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Invalid token" ? 401 : 400 }
    );
  }
}
