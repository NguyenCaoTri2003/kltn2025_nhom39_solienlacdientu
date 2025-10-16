export type EmailTemplateId =
  | 'test'
  | 'password_changed'
  | 'reset_password_admin'
  | 'welcome_user';

export interface TemplateRenderResult {
  subject: string;
  html: string;
  text?: string;
}

export type TemplateContext = Record<string, any>;

type TemplateRenderer = (ctx: TemplateContext) => TemplateRenderResult;

const appName = 'Hệ thống Sổ Liên Lạc điện tử';

const templates: Record<EmailTemplateId, TemplateRenderer> = {
  test: () => ({
    subject: `Test email từ ${appName}`,
    html: `<h3>Xin chào!</h3><p>Đây là email test từ ${appName}.</p>`
  }),
  password_changed: (ctx) => ({
    subject: 'Mật khẩu của bạn đã được thay đổi',
    html: `<p>Xin chào ${ctx.fullName || 'người dùng'},</p><p>Mật khẩu tài khoản của bạn vừa được thay đổi lúc <strong>${ctx.changedAt || new Date().toLocaleString('vi-VN')}</strong>. Nếu không phải bạn thực hiện, hãy liên hệ hỗ trợ ngay.</p>`
  }),
  reset_password_admin: (ctx) => ({
    subject: 'Mật khẩu của bạn đã được đặt lại',
    html: `<p>Xin chào ${ctx.fullName || 'người dùng'},</p><p>Quản trị viên đã đặt lại mật khẩu tài khoản của bạn.</p><p>Mật khẩu tạm thời: <strong>${ctx.tempPassword || '********'}</strong></p><p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`
  }),
  welcome_user: (ctx) => ({
    subject: `Chào mừng đến với ${appName}`,
    html: `<p>Xin chào ${ctx.fullName || 'bạn'},</p><p>Tài khoản của bạn đã được tạo với vai trò <strong>${ctx.role || 'user'}</strong>.</p><p>Đăng nhập: <strong>${ctx.email}</strong></p>`
  })
};

export function renderTemplate(id: EmailTemplateId, ctx: TemplateContext = {}): TemplateRenderResult {
  const renderer = templates[id];
  if (!renderer) throw new Error('Template not found');
  return renderer(ctx);
}
