import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/data/repositories/UserRepository';
import { AuthUseCase } from '@/core/usecases/authUseCase';

const userRepo = new UserRepository();
const authUseCase = new AuthUseCase(userRepo);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, role } = body;

    if (!identifier || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { user, token } = await authUseCase.login(identifier, password, role);

    return NextResponse.json({ user, token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
