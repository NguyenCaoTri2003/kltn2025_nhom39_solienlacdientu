// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { authenticate } from "@packages/utils/auth";
// import { UserRepository } from "@packages/data/repositories/UserRepository";
// import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
// import { sendEmail } from "../../../../email/mailer";
// import { renderTemplate } from "../../../../email/templates";

// const userRepo = new UserRepository();

// /**
//  * POST /api/auth/admin/reset-password
//  * {
//  *   "userId": 123,
//  *   "newPassword": "12345678"
//  * }
//  */
// export async function POST(req: NextRequest) {
//   try {
//     const { id: adminId, role } = await authenticate(req); 

//     if (role !== "admin") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
//     }

//     const body = await req.json();
//     const { userId, newPassword } = body as {
//       userId?: number;
//       newPassword?: string;
//     };

//     if (!userId || !newPassword) {
//       return NextResponse.json({ error: "Missing data" }, { status: 400 });
//     }

//     const user = await userRepo.findById(userId);
//     if (!user) {
//       return NextResponse.json({ error: "User does not exist" }, { status: 404 });
//     }

//     const newHash = await bcrypt.hash(newPassword, 10);
//     await userRepo.updateUser(userId, { password_hash: newHash });

 
//     interface BasicUser { email?: string; full_name?: string; username?: string }
//     const u = user as BasicUser;
//     if (u.email) {
//       try {
//         const tpl = renderTemplate('reset_password_admin', {
//           fullName: u.full_name || u.username || 'Người dùng',
//           tempPassword: newPassword,
//         });
//         await sendEmail({
//           to: u.email,
//           subject: tpl.subject,
//             html: tpl.html,
//             text: tpl.text,
//         });
//       } catch (mailErr) {
//         console.warn('[reset-password] Failed to send email:', mailErr);
//       }
//     }

//     try {
//       await logUserChange({
//         user_id: userId,
//         changed_by: adminId,
//         change_type: "reset_password",
//         changes: {
//           changed_at: new Date().toISOString(),
//           description: `Admin reset password for userID: ${userId}`,
//         },
//       });
//     } catch (logErr) {
//       console.warn("Failed to log reset password:", logErr);
//     }

//     return NextResponse.json({ message: "Password reset successfully" });
//   } catch (e) {
//     const msg = e instanceof Error ? e.message : 'System error';
//     return NextResponse.json({ error: msg ?? "System error" }, { status: 400 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
import { renderTemplate } from "../../../../email/templates";
import { sendEmailViaSendGrid } from "apps/api/src/app/email/resendMailer"; // 👈 dùng resend thay vì nodemailer

const userRepo = new UserRepository();

/**
 * POST /api/auth/admin/reset-password
 * {
 *   "userId": 123,
 *   "newPassword": "12345678"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { id: adminId, role } = await authenticate(req);

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newPassword } = body as {
      userId?: number;
      newPassword?: string;
    };

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    // Hash mật khẩu mới
    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updateUser(userId, { password_hash: newHash });

    // Nếu user có email thì gửi mail thông báo
    const u = user as { email?: string; full_name?: string; username?: string };
    if (u.email) {
      try {
        const tpl = renderTemplate("reset_password_admin", {
          fullName: u.full_name || u.username || "Người dùng",
          tempPassword: newPassword,
        });

        await sendEmailViaSendGrid({
          to: u.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });

        console.log(`[reset-password] ✅ Email sent to ${u.email}`);
      } catch (mailErr) {
        console.warn("[reset-password] ❌ Failed to send email via Resend:", mailErr);
      }
    }

    // Ghi log thay đổi mật khẩu
    try {
      await logUserChange({
        user_id: userId,
        changed_by: adminId,
        change_type: "reset_password",
        changes: {
          changed_at: new Date().toISOString(),
          description: `Admin reset password for userID: ${userId}`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to log reset password:", logErr);
    }

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "System error";
    return NextResponse.json({ error: msg ?? "System error" }, { status: 400 });
  }
}
