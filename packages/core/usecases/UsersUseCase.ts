// packages/core/usecases/UsersUseCase.ts
import { UserRepository } from "../../data/repositories/UserRepository";

export async function getAllUsers() {
  const repo = new UserRepository();
  return await repo.getAllUsersWithPagination();
}
