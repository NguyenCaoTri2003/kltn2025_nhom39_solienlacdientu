import { NextRequest, NextResponse } from "next/server";
import { MessageUseCase } from "@packages/core/usecases/MessageUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new MessageUseCase();

export async function PATCH(req: NextRequest, { params }: any) {
    try {
        const messageId = Number(params.id);
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = user.id;

        const result = await usecase.deleteMessage(messageId, userId);
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
