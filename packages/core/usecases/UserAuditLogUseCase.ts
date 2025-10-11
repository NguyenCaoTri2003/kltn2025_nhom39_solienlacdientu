import { UserAuditLogRepository } from "../../data/repositories/UserAuditLogRepository";
import { CreateUserAuditLogInput } from "../entities/UserAuditLog";

const repo = new UserAuditLogRepository();

/**
 * Hàm tiện dụng để ghi log khi user bị thay đổi
 */
export async function logUserChange(input: CreateUserAuditLogInput) {
  // Surface errors to callers so they can decide behavior
  return repo.createLog(input);
}
