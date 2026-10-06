// Single source for "which page needs which permission": the sidebar, the App
// navigation guard and the role matrix all read from here. UX only — every API
// call is still enforced server-side (RBAC.md golden rule).

export const PERMISSION_LABELS = {
  'users.list': 'Xem danh sách tài khoản', 'users.read': 'Xem tài khoản', 'users.update': 'Quản lý tài khoản và phân quyền', 'users.suspend': 'Khóa tài khoản',
  'tts.create': 'Tạo âm thanh', 'tts.cloud': 'Dùng giọng cloud', 'voices.read': 'Sử dụng thư viện giọng', 'clones.create': 'Tạo và quản lý giọng clone',
  'recordings.download': 'Tải âm thanh', 'content.manage_all': 'Truy cập nội dung của người khác',
  'projects.create': 'Tạo dự án', 'projects.read': 'Xem dự án', 'projects.update': 'Sửa dự án', 'projects.delete': 'Xóa dự án',
  'system.view_audit_log': 'Xem nhật ký quản trị', 'providers.manage': 'Quản lý API & nguồn giọng',
  'roles.manage': 'Quản lý vai trò', 'script.use': 'Kịch bản nhiều giọng', 'batch.use': 'Tạo hàng loạt',
};

export const MATRIX_COLUMNS = [['view', 'Truy cập'], ['create', 'Tạo'], ['update', 'Sửa'], ['delete', 'Xóa'], ['extra', 'Quyền thêm']];

// Each cell lists the permission keys it toggles together; `extra` cells render
// one labelled checkbox per key. A row without `view` is always reachable.
export const MATRIX_ROWS = [
  { group: 'Làm việc', id: 'studio', label: 'Chuyển văn bản', cells: { view: ['tts.create'], extra: ['tts.cloud'] } },
  { group: 'Làm việc', id: 'script', label: 'Kịch bản nhiều giọng', cells: { view: ['script.use'] } },
  { group: 'Làm việc', id: 'batch', label: 'Tạo hàng loạt', cells: { view: ['batch.use'] } },
  { group: 'Làm việc', id: 'projects', label: 'Dự án', cells: { view: ['projects.read'], create: ['projects.create'], update: ['projects.update'], delete: ['projects.delete'] } },
  { group: 'Giọng & kết quả', id: 'voices', label: 'Thư viện giọng', cells: { view: ['voices.read'] } },
  { group: 'Giọng & kết quả', id: 'clones', label: 'Giọng của tôi (clone)', cells: { view: ['clones.create'] } },
  { group: 'Giọng & kết quả', id: 'library', label: 'Thư viện âm thanh', cells: { extra: ['recordings.download'] } },
  { group: 'Hệ thống', id: 'providers', label: 'API & Nguồn giọng', cells: { view: ['providers.manage'] } },
  { group: 'Quản trị', id: 'admin-users', label: 'Nhân viên', cells: { view: ['users.list', 'users.read'], update: ['users.update'], extra: ['users.suspend'] } },
  { group: 'Quản trị', id: 'admin-roles', label: 'Vai trò & ma trận quyền', cells: { view: ['roles.manage'] } },
  { group: 'Quản trị', id: 'admin-logs', label: 'Nhật ký & lỗi hệ thống', cells: { view: ['system.view_audit_log'] } },
  { group: 'Quản trị', id: 'content', label: 'Nội dung của người khác', cells: { view: ['content.manage_all'] } },
];

export const MATRIX_KEYS = new Set(MATRIX_ROWS.flatMap((row) => Object.values(row.cells).flat()));

const ADMIN_TAB_PERMISSIONS = { users: 'users.list', roles: 'roles.manage', audit: 'system.view_audit_log', logs: 'system.view_audit_log' };
export const adminTabs = (can) => Object.keys(ADMIN_TAB_PERMISSIONS).filter((tab) => can(ADMIN_TAB_PERMISSIONS[tab]));

const PAGE_PERMISSION = Object.fromEntries(MATRIX_ROWS.filter((row) => row.cells.view && !row.id.includes('-')).map((row) => [row.id, row.cells.view[0]]));

export function canOpenPage(page, can) {
  if (page === 'admin') return adminTabs(can).length > 0;
  const permission = PAGE_PERMISSION[page];
  return !permission || can(permission);
}

export function rowKeys(row) {
  return Object.values(row.cells).flat();
}

// Toggle one cell and keep the row consistent: any action implies page access,
// and removing page access removes every action on that page.
export function toggleCell(selected, row, column, key, on) {
  const next = new Set(selected);
  const keys = key ? [key] : row.cells[column];
  keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
  if (on && column !== 'view') row.cells.view?.forEach((k) => next.add(k));
  if (!on && column === 'view') rowKeys(row).forEach((k) => next.delete(k));
  return next;
}

export function slugifyRole(name) {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^[^a-z]+|_+$/g, '').slice(0, 32).replace(/_+$/, '');
  return slug.length >= 2 ? slug : '';
}

export function randomPassword(length = 16) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join('');
}
