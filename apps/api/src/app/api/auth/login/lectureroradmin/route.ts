import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/data/repositories/UserRepository";
import { AuthUseCase } from "@/core/usecases/authUseCase";

const userRepo = new UserRepository();
const authUseCase = new AuthUseCase(userRepo);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, role } = body;

    const { user, token } = await authUseCase.loginLecturerOrAdmin(identifier, password);

     const res = NextResponse.json({ user });
      res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, 
        sameSite: "lax",
      });
      res.cookies.set("user", JSON.stringify(user), {
        httpOnly: false, 
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
