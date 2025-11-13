// import { NextRequest, NextResponse } from "next/server";
// import { UserRepository } from "@packages/data/repositories/UserRepository";
// import { AuthUseCase } from "@packages/core/usecases/authUseCase";
// import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";

// const userRepo = new UserRepository();
// const authUseCase = new AuthUseCase(userRepo);

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { identifier, password, role } = body;

//     const { user, token } = await authUseCase.loginLecturerOrAdmin(identifier, password);

//     const status = String((user as any)?.status || "").toLowerCase();
//     if (status === "inactive") {
//       return NextResponse.json(
//         { error: "Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên." },
//         { status: 403 }
//       );
//     }

//     if (status === "suspended") {
//       const oldStatus = user.status;

//       const updatedUser = await userRepo.updateUserStatus(user.id, "active");

//       // Ghi log hành động hệ thống
//       await logUserChange({
//         user_id: user.id,
//         changed_by: null,
//         change_type: "status_change",
//         changes: {
//           old_status: oldStatus,
//           new_status: "active",
//           reason: "First-time login",
//           changed_at: new Date().toISOString(),
//           source: "system",
//         },
//       });

//       user.status = updatedUser.status;
//     }
//     //

//     const res = NextResponse.json({ user, token }, { status: 200 });
//     res.cookies.set("token", token, {
//       httpOnly: true,
//       path: "/",
//       maxAge: 60 * 60 * 24,
//       // sameSite: "lax",
//       sameSite: "none",
//       secure: true,
//     });
//     res.cookies.set("user", JSON.stringify(user), {
//       httpOnly: false,
//       path: "/",
//       maxAge: 60 * 60 * 24,
//       // sameSite: "lax",
//       sameSite: "none", 
//       secure: true,
//     });

//     return res;
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 400 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { AuthUseCase } from "@packages/core/usecases/authUseCase";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

redis.on("error", (err) => {
  console.error("[ioredis] Error event:", err);
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "login_fail_attempts",
  points: 5,
  duration: 300,
  blockDuration: 300,
});

const userRepo = new UserRepository();
const authUseCase = new AuthUseCase(userRepo);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    const forwardedFor = req.headers.get("x-forwarded-for")
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown"

    try {
      await rateLimiter.consume(ip)
    } catch (rlRes: any) {
      const retrySecs = Math.round(rlRes.msBeforeNext / 1000) || 300
      const retryMins = Math.ceil(retrySecs / 60)
      return NextResponse.json(
        { error: `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${retryMins} phút.` },
        { status: 429 }
      )
    }

    const { user, token } = await authUseCase.loginLecturerOrAdmin(identifier, password);

    await rateLimiter.delete(ip);

    const status = String((user as any)?.status || "").toLowerCase();
    if (status === "inactive") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    if (status === "suspended") {
      const oldStatus = user.status;
      const updatedUser = await userRepo.updateUserStatus(user.id, "active");

      await logUserChange({
        user_id: user.id,
        changed_by: null,
        change_type: "status_change",
        changes: {
          old_status: oldStatus,
          new_status: "active",
          reason: "First-time login",
          changed_at: new Date().toISOString(),
          source: "system",
        },
      });

      user.status = updatedUser.status;
    }

    const res = NextResponse.json({ user, token }, { status: 200 });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "none",
      secure: true,
    });
    res.cookies.set("user", JSON.stringify(user), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "none",
      secure: true,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}