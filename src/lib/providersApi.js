// Client for the TTS Provider Manager (Python API, /api/tts). Admin-only for
// management endpoints. The API key is only ever SENT (create/update); it is
// never returned — the UI shows `has_credentials` instead. All calls go through
// apiFetch so the access token + silent-renew behaviour is shared.
import { apiFetch, apiJson } from './authApi';

const BASE = '/api/tts/providers';

export function listProviders() {
  return apiJson(BASE); // { items:[...], encryption_ready:bool }
}

export function createProvider(body) {
  return apiJson(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export function updateProvider(id, body) {
  return apiJson(`${BASE}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function deleteProvider(id) {
  const response = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || 'Không xóa được provider.');
  }
}

export function testProvider(id) {
  return apiJson(`${BASE}/${id}/test`, { method: 'POST' });
}

export function syncVoices(id) {
  return apiJson(`${BASE}/${id}/sync-voices`, { method: 'POST' });
}

export function getModels(id) {
  return apiJson(`${BASE}/${id}/models`);
}

export function getVoices(id) {
  return apiJson(`${BASE}/${id}/voices`);
}
