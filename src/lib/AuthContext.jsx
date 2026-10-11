// Auth/RBAC state — RBAC.md §6 "usePermission hook". Access token lives in
// memory only (never localStorage), refresh happens silently via the
// HttpOnly cookie on mount (auth-flow.md Lessons #2).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from './authApi';

export const AuthContext = createContext(null);

const SUPER_ADMIN_ROLE = 'super_admin';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null); // { id, roles, permissions }
  const [status, setStatus] = useState('checking'); // checking | anonymous | authenticated

  const loadMe = useCallback(async (token) => {
    authApi.setApiToken(token);
    const profile = await authApi.me(token);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await authApi.renew();
        if (cancelled) return;
        setAccessToken(result.access_token);
        await loadMe(result.access_token);
        if (!cancelled) setStatus('authenticated');
      } catch {
        if (!cancelled) setStatus('anonymous');
      }
    })();
    return () => { cancelled = true; };
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    setAccessToken(result.access_token);
    await loadMe(result.access_token);
    setStatus('authenticated');
  }, [loadMe]);

  const register = useCallback((email, password) => authApi.register(email, password), []);
  const finishGoogleMFA = useCallback(async (code) => {
    const result = await authApi.googleMFA(code);
    if (result.next) window.history.replaceState(null, '', '/login?next=' + encodeURIComponent(result.next));
    setAccessToken(result.access_token);
    await loadMe(result.access_token);
    setStatus('authenticated');
  }, [loadMe]);
  const refreshUser = useCallback(async () => {
    const profile = await authApi.apiJson('/api/me');
    setUser(profile);
    return profile;
  }, []);
  const verifyEmail = useCallback((token) => authApi.verifyEmail(token), []);

  const logout = useCallback(async () => {
    try { await authApi.logoutAll(accessToken); } catch { /* best-effort: clear local state regardless */ }
    setAccessToken(null);
    authApi.setApiToken(null);
    setUser(null);
    setStatus('anonymous');
  }, [accessToken]);

  useEffect(() => {
    const expire = () => { setUser(null); setAccessToken(null); setStatus('anonymous'); };
    window.addEventListener('voice-session-expired', expire);
    return () => window.removeEventListener('voice-session-expired', expire);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const response = await authApi.apiFetch('/api/me');
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          authApi.setApiToken(null); setUser(null); setAccessToken(null); setStatus('anonymous');
        } else if (response.ok) {
          const profile = await response.json();
          if (active) setUser(profile);
        }
      } catch { /* Keep session during a transient connection failure. */ }
    }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [status]);

  const value = useMemo(
    () => ({ status, user, accessToken, login, register, verifyEmail, logout, refreshUser, finishGoogleMFA }),
    [status, user, accessToken, login, register, verifyEmail, logout, refreshUser, finishGoogleMFA]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within <AuthProvider>');
  return ctx;
}

// RBAC.md §6.1 — super_admin bypasses every check, mirroring the backend
// middleware (RBAC.md §5.1) so the UI and the server never disagree.
export function usePermission() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const permissions = user?.permissions || [];
  const can = (permission) => roles.includes(SUPER_ADMIN_ROLE) || permissions.includes(permission);
  return {
    can,
    canAny: (...perms) => perms.some(can),
    canAll: (...perms) => perms.every(can),
    hasRole: (role) => roles.includes(role),
  };
}
