import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@packages/data/repositories/UserRepository';
import { authenticate } from "@packages/utils/auth";
import { logUserChange } from '@packages/core/usecases/UserAuditLogUseCase';

const repo = new UserRepository();

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params; 
    const userPayload = await authenticate(req);

    if (userPayload.id !== Number(id) && userPayload.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const user = await repo.findById(Number(id));
    return new Response(JSON.stringify(user));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 401 });
  }
}

// export async function PATCH(req: NextRequest, { params }: { params: any }) {
//   try {
//     const { id } = await params; 
//     const payload = await authenticate(req); 

//     if (payload.id !== Number(id) && payload.role !== "admin") {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const updates = await req.json(); 
//     const user = await repo.updateUserFull(Number(id), updates);

//     return NextResponse.json(user);
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: e.message === "Invalid token" ? 401 : 400 });
//   }
// }


export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = params;
    const payload = await authenticate(req);

    // THÊM DÒNG LOG NÀY
    console.log("PATCH /api/users:", {
      id,
      payload,
      body: await req.clone().json(), // clone req để log mà không làm mất body
    });

    const updates = await req.json();

    const user = await repo.updateUserFull(Number(id), updates);

    // //  Lấy user cũ trước khi update để biết thay đổi
    // const oldUser = await repo.findById(Number(id));

    // const updatedUser = await repo.updateUserFull(Number(id), updates);

    // // So sánh để ghi log thay đổi
    // await logUserChange({
    //   user_id: Number(id),              // người bị thay đổi
    //   changed_by: payload?.id || null,  // người thực hiện thay đổi
    //   change_type: "profile_update",
    //   changes: {
    //     old_data: oldUser,
    //     new_data: updatedUser,
    //     changed_at: new Date().toISOString(),

    //   },
    // });

    // Log sau khi update
    console.log("Updated user result:", user);

    return NextResponse.json(user);
  } catch (e: any) {
    console.error("PATCH ERROR:", e);
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Invalid token" ? 401 : 400 }
    );
  }
}
