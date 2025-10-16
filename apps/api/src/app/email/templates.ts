export type EmailTemplateId =
  | 'test'
  | 'password_changed'
  | 'reset_password_admin'
  | 'welcome_user'
  | 'account_status_changed';

export interface TemplateRenderResult {
  subject: string;
  html: string;
  text?: string;
}

export type TemplateContext = Record<string, unknown>;

type TemplateRenderer = (ctx: TemplateContext) => TemplateRenderResult;

const appName = 'Hệ thống Sổ Liên Lạc điện tử';

const templates: Record<EmailTemplateId, TemplateRenderer> = {
  test: () => ({
    subject: `Test email từ ${appName}`,
    html: `<h3>Xin chào!</h3><p>Đây là email test từ ${appName}.</p>`
  }),
  password_changed: (ctx) => ({
    subject: 'Mật khẩu của bạn đã được thay đổi',
    html: `<p>Xin chào ${ctx['fullName'] || 'người dùng'},</p><p>Mật khẩu tài khoản của bạn vừa được thay đổi lúc <strong>${ctx['changedAt'] || new Date().toLocaleString('vi-VN')}</strong>. Nếu không phải bạn thực hiện, hãy liên hệ hỗ trợ ngay.</p>`
  }),
  reset_password_admin: (ctx) => ({
    subject: 'Mật khẩu của bạn đã được đặt lại',
    html: `<p>Xin chào ${ctx['fullName'] || 'người dùng'},</p><p>Quản trị viên đã đặt lại mật khẩu tài khoản của bạn.</p><p>Mật khẩu tạm thời: <strong>${ctx['tempPassword'] || '********'}</strong></p><p>Vui lòng đăng nhập và đặt lại mật khẩu.</p>`
  }),
  welcome_user: (ctx) => ({
    subject: `Chào mừng đến với ${appName}`,
    html: `<p>Xin chào ${ctx['fullName'] || 'bạn'},</p><p>Tài khoản của bạn đã được tạo với vai trò <strong>${ctx['role'] || 'user'}</strong>.</p><p>Đăng nhập: <strong>${ctx['email'] || ''}</strong></p>`
  }),
  account_status_changed: (ctx) => ({
    subject: 'Trạng thái tài khoản của bạn đã thay đổi',
    html: `<p>Xin chào ${ctx['fullName'] || 'người dùng'},</p>
           <p>Trạng thái tài khoản của bạn đã được cập nhật: <strong>${ctx['newStatus']}</strong>.</p>
           ${ctx['reason'] ? `<p>Lý do: ${ctx['reason']}</p>` : ''}
           <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>`
  })
};

export function renderTemplate(id: EmailTemplateId, ctx: TemplateContext = {}): TemplateRenderResult {
  const renderer = templates[id];
  if (!renderer) throw new Error('Template not found');
  return renderer(ctx);
}
