import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../data/repositories/UserRepository";
import { User } from "../../core/entities/Users";

const JWT_SECRET = process.env.JWT_SECRET;

console.log("JWT_SECRET:", JWT_SECRET);

export class AuthUseCase {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async login(identifier: string, password: string, role: string): Promise<{ user: User; token: string }> {
    let user: User | null = null;

    if (role === "STUDENT") {
      user = await this.userRepo.findByStudentCode(identifier);
    } else if (role === "PARENT") {
      user = await this.userRepo.findByPhone(identifier);
    } else if (role === "LECTURER") {
      user = await this.userRepo.findByLecturerCode(identifier);
    } else {
      throw new Error("Invalid role");
    }

    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    await this.userRepo.updateUser(user.id, { last_login: new Date().toISOString() });

    return { user, token };
  }
}
