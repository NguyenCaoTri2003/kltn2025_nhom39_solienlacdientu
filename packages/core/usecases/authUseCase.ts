import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../data/repositories/UserRepository";
import { User } from "../../core/entities/Users";

const JWT_SECRET = process.env.JWT_SECRET;

export class AuthUseCase {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async loginLecturerOrAdmin(identifier: string, password: string): Promise<{ user: User; token: string }> {
    let user: User | null = null;

    if (identifier.includes("@")) {
      user = await this.userRepo.findByEmailAdmin(identifier);
    }
    if (!user) {
      user = await this.userRepo.findByLecturerCode(identifier);
    }

    if (!user) throw new Error("Thông tin đăng nhập không hợp lệ");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Thông tin đăng nhập không hợp lệ");

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    await this.userRepo.updateUser(user.id, { last_login: new Date().toISOString() });

    return { user, token };
  }

  async loginStudentOrParent(
    identifier: string,
    password: string,
    role: "student" | "parent"
  ): Promise<{ user: User; token: string }> {
    let user: User | null = null;

    user = await this.userRepo.findByStudentCode(identifier);
    if (!user) {
      user = await this.userRepo.findByPhone(identifier);
    }

    if (!user) throw new Error("Thông tin đăng nhập không hợp lệ");

    if (user.role !== role) {
      throw new Error("Tài khoản không phù hợp với vai trò đăng nhập");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Thông tin đăng nhập không hợp lệ");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    await this.userRepo.updateUser(user.id, { last_login: new Date().toISOString() });
    return { user, token };
  }
}
