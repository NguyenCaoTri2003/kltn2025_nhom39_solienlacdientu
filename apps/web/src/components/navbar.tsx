import NavbarClient from "./navbar-client";
import { cookies } from "next/headers";

export default async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = cookieStore.get("user")?.value ? JSON.parse(cookieStore.get("user")!.value) : null;

  const userRole: "admin" | "lecturer" | "student" | "parent" | null = user?.role === "admin" ? "admin" : user?.role === "lecturer" ? "lecturer" : user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : null;
  const userName: string = user?.full_name || "";
  const avatarUrl: string | null = user?.avatar_url || null;
  const userId = user?.id || null;
  const adminType: string | null = user?.admin_type || null;

  return <NavbarClient userRole={userRole} userName={userName} avatarUrl={avatarUrl} userId={userId} adminType={adminType} />;
}
