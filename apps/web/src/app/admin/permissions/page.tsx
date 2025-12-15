import { AdminPermissionsManagement } from "@/components/admin/admin-permissions/AdminPermissionsManagement";
import { cookies } from "next/headers";
import type { AdminType } from "@/services/adminPermissionService";

export default async function Page() {
  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value
    ? JSON.parse(cookieStore.get("user")!.value)
    : null;

  const currentAdminId: number | null = user?.id || null;
  const currentAdminType: AdminType | null = (user?.admin_type as AdminType) || null;

  return (
    <AdminPermissionsManagement
      currentAdminId={currentAdminId ?? undefined}
      currentAdminType={currentAdminType ?? null}
    />
  );
}

