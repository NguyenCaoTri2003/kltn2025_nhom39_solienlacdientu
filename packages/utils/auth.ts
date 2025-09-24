import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: number;
  role: string;
}

export function authenticate(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No token");

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    throw new Error("Invalid token");
  }
}
