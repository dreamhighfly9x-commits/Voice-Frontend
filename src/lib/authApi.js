// Thin client for the Go auth/RBAC service (.claude/references/auth-flow.md,
// RBAC.md). Same-origin via the Vite proxy — see vite.config.js — so cookies
// (the HttpOnly refresh token) travel automatically with credentials: 'include'.

import {beginVoiceTask,updateVoiceTask,endVoiceTask,resetVoiceTasks} from './dreamBotActivity';

const ERROR_MESSAGES = {
  OTP_REQUIRED: 'Nhập mã xác thực hai bước để tiếp tục.',
  OTP_INVALID: 'Mã xác thực không đúng hoặc đã được sử dụng.',
  ACCOUNT_SUSPENDED: 'Tài khoản đã bị khóa. Liên hệ Admin.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn.',
  TOKEN_INVALID: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực.',
  LOCKED_OUT: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ít phút.',
  RATE_LIMITED: 'Thao tác quá nhanh, thử lại sau ít phút.',
  INVALID_TOKEN: 'Token không hợp lệ hoặc đã hết hạn.',
  REUSE_DETECTED: 'Phát hiện phiên đăng nhập bất thường, vui lòng đăng nhập lại.',
};

let token = null;
let renewal = null;
export const currentApiToken = () => token;
export function setApiToken(value) { token = value; if(!value)resetVoiceTasks(); }
export async function apiFetch(path, options = {}) {
  if(path==='/api/synthesize'&&options.method==='POST'){
    const id=crypto.randomUUID();beginVoiceTask(id);
    let active=true,timer,controller;
    const poll=async()=>{
      if(!active)return;
      if(!document.hidden){
        controller=new AbortController();
        try{const result=await fetch('/api/tts-activity/'+id,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:controller.signal});if(active&&result.ok)updateVoiceTask(id,(await result.json()).state);}catch{/* request result remains authoritative */}
      }
      if(active)timer=setTimeout(poll,800);
    };
    timer=setTimeout(poll,250);
    try{
      const response=await authenticatedFetch(path,{...options,headers:{...options.headers,'X-Voice-Task':id}});
      const record=response.ok&&!options.signal?.aborted?await response.clone().json().catch(()=>null):null;
      endVoiceTask(id,record);return response;
    }catch(error){endVoiceTask(id,null);throw error;}
    finally{active=false;clearTimeout(timer);controller?.abort();}
  }
  return authenticatedFetch(path,options);
}
async function authenticatedFetch(path, options = {}) {
  const run = () => fetch(path, { ...options, headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  let response = await run();
  if (response.status === 401) {
    if (!renewal) renewal = renew().then((result) => { token = result.access_token; }).finally(() => { renewal = null; });
    try { await renewal; response = await run(); }
    catch { token = null; window.dispatchEvent(new Event('voice-session-expired')); }
  }
  return response;
}

// FastAPI validation errors put an array (or object) in `detail`; turn any shape
// into a readable string so the UI never shows "[object Object]".
export function errorMessage(body) {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || (e?.loc ? e.loc.filter((x) => x !== 'body').join('.') + ': ' + (e.msg || '') : JSON.stringify(e))).join('; ');
  if (d && typeof d === 'object') return d.message || JSON.stringify(d);
  return body?.error || body?.message || 'Không thực hiện được yêu cầu.';
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error(errorMessage(body)); error.status = response.status; throw error; }
  return body;
}

async function parseError(response) {
  const body = await response.json().catch(() => null);
  const message = (body?.code && ERROR_MESSAGES[body.code]) || body?.error || body?.message || 'Có lỗi xảy ra, thử lại sau.';
  return new Error(message);
}

async function postJson(path, body, accessToken) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

export function register(email, password) {
  return postJson('/api/auth/register', { email, password });
}

export function login(email, password) {
  return postJson('/api/auth/login', { email, password });
}

export function googleMFA(code) {
  return postJson('/api/auth/google/mfa', { code });
}

// Silent renew — relies on the refresh cookie the browser already holds.
let refreshRequest = null;
export function renew() {
  if (!refreshRequest) refreshRequest = postJson('/api/auth/renew', {}).finally(() => { refreshRequest = null; });
  return refreshRequest;
}

export async function verifyEmail(token) {
  const response = await fetch('/api/auth/verify?token=' + encodeURIComponent(token), { credentials: 'include' });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

export function logout(accessToken) {
  return postJson('/api/auth/logout', {}, accessToken);
}

export function logoutAll(accessToken) {
  return postJson('/api/auth/logout-all', {}, accessToken);
}

export async function me(accessToken) {
  const response = await fetch('/api/me', {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}
