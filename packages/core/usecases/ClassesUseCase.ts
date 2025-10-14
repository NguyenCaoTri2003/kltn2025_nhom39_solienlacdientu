import { ClassesRepository } from "../../data/repositories/ClassesRepository";

export async function getClassesByMajor(majorId: number, user: any) {
  const allowedRoles = ["admin", "lecturer", "student"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("You do not have access!");
  }

  const repo = new ClassesRepository();
  return await repo.getClassesByMajor(majorId);
}

export async function getAllClasses(user: any) {
  const allowedRoles = ["admin", "lecturer", "student"];
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("You do not have access!");
  }

  const repo = new ClassesRepository();
  return await repo.getAllClasses();
}
