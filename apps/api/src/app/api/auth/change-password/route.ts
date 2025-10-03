import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticate } from "../../../../../../../packages/utils/auth";
import { UserRepository } from "../../../../../../../packages/data/repositories/UserRepository";


/**  http://localhost:3000/api/auth/change-password
{ 
    "currentPassword": "11111111", 
    "newPassword": "00000000" 
}
*/

const userRepo = new UserRepository();

export async function POST(req: NextRequest) {
  try {
    const { id } = authenticate(req);
    const body = await req.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const user = await userRepo.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, (user as any).password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updateUser(id, { password_hash: newHash });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "System error" }, { status: 400 });
  }
}
