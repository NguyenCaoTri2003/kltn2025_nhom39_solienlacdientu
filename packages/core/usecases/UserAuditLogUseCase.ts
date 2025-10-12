import { UserAuditLogRepository } from "../../data/repositories/UserAuditLogRepository";
import { CreateUserAuditLogInput } from "../entities/UserAuditLog";

const repo = new UserAuditLogRepository();

export async function logUserChange(input: CreateUserAuditLogInput) {
  return repo.createLog(input);
}
