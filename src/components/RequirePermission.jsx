// RBAC.md §6.3 route/section guard. UX only — the real check is the
// authorize(permission) middleware on the Go auth-api; this just hides UI
// the caller couldn't use anyway.
import { usePermission } from '../lib/AuthContext';

export default function RequirePermission({ permission, fallback = null, children }) {
  const { can } = usePermission();
  const required = Array.isArray(permission) ? permission : [permission];
  if (!required.every(can)) return fallback;
  return children;
}
