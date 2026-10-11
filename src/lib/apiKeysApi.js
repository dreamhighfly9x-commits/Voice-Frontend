// Personal API key client. The backend has no API-key store yet: every call
// resolves { supported: false } on 404/405/501 so the docs page can explain the
// session-token fallback instead of faking keys. When /api/api-keys ships with
// this contract the UI starts working without changes:
//   GET    /api/api-keys        -> [{ id, name, prefix, created_at, last_used_at }]
//   POST   /api/api-keys {name} -> { id, name, prefix, key }  (key shown once)
//   DELETE /api/api-keys/:id
import { apiFetch, currentApiToken, errorMessage } from './authApi';

const UNSUPPORTED = new Set([404, 405, 501]);

async function call(path, options) {
  const response = await apiFetch(path, options);
  if (UNSUPPORTED.has(response.status)) return { supported: false };
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body));
  return { supported: true, data: body };
}

export const listApiKeys = () => call('/api/api-keys');
export const createApiKey = (name) => call('/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
export const revokeApiKey = (id) => call('/api/api-keys/' + encodeURIComponent(id), { method: 'DELETE' });

// The caller's own short-lived access token (15 min), for trying the API before keys exist.
export const sessionToken = () => currentApiToken();
