import { NotificationsRepository, type ListParams, type ListResult, type NotificationRow, type NotificationType } from "@packages/data/repositories/NotificationsRepository";

export class NotificationsUseCase {
  private repo: NotificationsRepository;

  constructor(repo?: NotificationsRepository) {
    this.repo = repo ?? new NotificationsRepository();
  }

  async list(params: { userId?: number | string; page?: number; pageSize?: number }): Promise<ListResult> {
    const p: ListParams = {
      userId: this.toPositiveInt(params.userId),
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    };
    return this.repo.list(p);
  }

  async getById(id: number | string): Promise<NotificationRow | null> {
    const nid = this.toPositiveInt(id);
    if (!nid) return null;
    return this.repo.getById(nid);
  }

  async create(payload: { user_id?: number | string | null; content?: string | null; type?: NotificationType | null }): Promise<NotificationRow> {
    const user_id = payload.user_id != null ? this.toPositiveInt(payload.user_id) ?? null : null;
    const content = typeof payload.content === "string" ? payload.content : null;
    const type = (payload.type ?? null) as NotificationType | null;
    return this.repo.create({ user_id, content, type });
  }

  async delete(id: number | string): Promise<void> {
    const nid = this.toPositiveInt(id);
    if (!nid) return;
    await this.repo.delete(nid);
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const notificationsUseCase = new NotificationsUseCase();
