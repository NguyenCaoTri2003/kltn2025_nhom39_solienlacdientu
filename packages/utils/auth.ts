import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: number;
  role: string;
}

export function authenticate(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get("Authorization");
  // Prefer Authorization header; fallback to cookie named 'token'
  const headerToken = authHeader?.replace("Bearer ", "").trim();
  const cookieToken = req.cookies.get("token")?.value;
  const token = headerToken || cookieToken;
  if (!token) throw new Error("No token");

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    throw new Error("Invalid token");
  }
}
