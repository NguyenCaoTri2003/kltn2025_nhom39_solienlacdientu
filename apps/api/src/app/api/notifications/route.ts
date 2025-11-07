import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { supabase } from "@packages/data/supabaseClient";
import { NotificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export const runtime = 'nodejs';
const notificationsUseCase = new NotificationsUseCase();

// GET /api/notifications?grouped=true&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const grouped = true; // mặc định là grouped true, không cho phép override via URL
    //const grouped = (url.searchParams.get('grouped') ?? 'true') === 'true';  // cho phép override via URL
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '20')));
    const title = (url.searchParams.get('title') || '').trim();
    const content = (url.searchParams.get('content') || '').trim();
    const type = (url.searchParams.get('type') || '').trim();
    const category = (url.searchParams.get('category') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();
    const fromAt = (url.searchParams.get('from') || '').trim();
    const toAt = (url.searchParams.get('to') || '').trim();

    let user;
    try {
      user = await authenticate(req as unknown as Request);
    } catch {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Admin only", data: null },
        { status: 403 }
      );
    }

    const { items, meta } = await notificationsUseCase.listNotifications({
      grouped,
      page,
      pageSize,
      title: title || undefined,
      content: content || undefined,
      type: (type || undefined) as unknown as 'university' | 'lecturer' | 'system' | null | undefined,
      category: category || undefined,
      from: fromAt || undefined,
      to: toAt || undefined,
      status: (status || undefined) as unknown as 'sent' | 'deleted' | null | undefined,
    });
    return NextResponse.json({ returnCode: 0, message: 'OK', data: items, meta });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ returnCode: -1, message: msg, data: null }, { status: 500 });
  }
}

// PUT /api/notifications  
// Body: { notificationId?: number, broadcast_group_id?: string, notificationIds?: number[] }
export async function PUT(req: NextRequest) {
  try {
 
    let user;
    try {
      user = await authenticate(req as unknown as Request);
    } catch {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Admin only", data: null },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { notificationId, broadcast_group_id, notificationIds } = body as { 
      notificationId?: number; 
      broadcast_group_id?: string; 
      notificationIds?: number[];
    };

    // Xóa nhiều notifications
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      try {
        const affected = await notificationsUseCase.deleteMultiple(notificationIds);
        return NextResponse.json({ 
          returnCode: 0, 
          message: `Deleted ${affected} notification(s)`, 
          data: { affected } 
        });
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Internal error';
        if (errorMessage.includes('đã bị xóa') || errorMessage.includes('already deleted')) {
          return NextResponse.json({ 
            returnCode: -1, 
            message: errorMessage, 
            data: null 
          }, { status: 400 });
        }
        throw deleteError;
      }
    }

    if (!notificationId && !broadcast_group_id) {
      return NextResponse.json({ returnCode: -1, message: 'Missing notificationId, broadcast_group_id, or notificationIds', data: null }, { status: 400 });
    }

    let groupId = broadcast_group_id ?? null;
    if (!groupId && notificationId) {
      const { data: row, error } = await supabase
        .from('notifications')
        .select('id, broadcast_group_id, status')
        .eq('id', notificationId)
        .maybeSingle();
      if (error) throw error;
      if (!row) return NextResponse.json({ returnCode: -1, message: 'Notification not found', data: null }, { status: 404 });
      
      if (row.status === 'deleted') {
        return NextResponse.json({ 
          returnCode: -1, 
          message: 'Không thể xóa thông báo đã bị xóa. Vui lòng kiểm tra lại.', 
          data: null 
        }, { status: 400 });
      }
      
      groupId = row.broadcast_group_id ?? null;
      if (!groupId) {
        const { error: upErr } = await supabase
          .from('notifications')
          .update({ is_deleted: true, is_read: true, status: 'deleted' })
          .eq('id', notificationId);
        if (upErr) throw upErr;
        return NextResponse.json({ returnCode: 0, message: 'Deleted', data: { affected: 1 } });
      }
    }

    const { data: affectedRows, error: delErr } = await supabase
      .from('notifications')
      .update({ is_deleted: true, is_read: true, status: 'deleted' })
      .eq('broadcast_group_id', groupId!)
      .select('id');
    if (delErr) throw delErr;

    return NextResponse.json({ returnCode: 0, message: 'Deleted broadcast', data: { affected: affectedRows?.length ?? 0 } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ returnCode: -1, message: msg, data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }

    const user = await authenticate(req);
    if (user.role !== "admin") {
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });
    }

    const body = await req.json();
    const { mode, title, content, type = "university", category = "GENERAL", url } = body || {};

    if (!title && !content) {
      return NextResponse.json({ returnCode: -1, message: "Title or content is required", data: null }, { status: 400 });
    }

    if (mode === "broadcast") {
      const result = await notificationsUseCase.createForAll({ 
        title, 
        content, 
        type, 
        category,
        url: url || null 
      });
      return NextResponse.json({ returnCode: 0, message: "Broadcast created", data: { created: result.created } }, { status: 201 });
    }

    const notification = await notificationsUseCase.create({
      user_id: body?.user_id ?? null,
      title,
      content,
      type,
      category,
      target_student_id: body?.target_student_id ?? null,
      url: url || null, 
    });
    return NextResponse.json({ returnCode: 0, message: "Notification created", data: notification }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}


