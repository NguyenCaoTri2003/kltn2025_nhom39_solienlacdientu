import { JwtPayload } from "./auth";
import { AdminType } from "@packages/core/entities/Users";

// Kiểm tra user có phải là admin không
export function isAdmin(user: JwtPayload): boolean {
  return user.role === "admin";
}

// Kiểm tra user có phải là super admin không
export function isSuperAdmin(user: JwtPayload): boolean {
  return user.role === "admin" && user.admin_type === "super_admin";
}

// Kiểm tra user có quyền quản lý tài khoản không
export function canManageAccounts(user: JwtPayload): boolean {
  if (!isAdmin(user)) return false;
  if (isSuperAdmin(user)) return true;
  return user.admin_type === "admin_account" || user.admin_type === "super_admin";
}

// Kiểm tra user có quyền quản lý học vụ không
export function canManageAcademic(user: JwtPayload): boolean {
  if (!isAdmin(user)) return false;
  if (isSuperAdmin(user)) return true;
  return user.admin_type === "admin_academic" || user.admin_type === "super_admin";
}

// Kiểm tra user có quyền quản lý tài chính không
export function canManageFinance(user: JwtPayload): boolean {
  if (!isAdmin(user)) return false;
  if (isSuperAdmin(user)) return true;
  return user.admin_type === "admin_finance" || user.admin_type === "super_admin";
}

// Kiểm tra user có quyền cụ thể không
export function hasAdminPermission(user: JwtPayload, permission: AdminType | "super_admin"): boolean {
  if (!isAdmin(user)) return false;
  if (permission === "super_admin") return isSuperAdmin(user);
  return user.admin_type === permission || isSuperAdmin(user);
}

