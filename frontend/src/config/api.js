const rawUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  ''
).trim().replace(/\/+$/, '');

export const API_BASE = !rawUrl
  ? '/api'
  : rawUrl.endsWith('/api')
    ? rawUrl
    : `${rawUrl}/api`;

export const BACKEND_URL = !rawUrl
  ? ''
  : rawUrl.endsWith('/api')
    ? rawUrl.slice(0, -4)
    : rawUrl;

export default {
  API_BASE,
  BACKEND_URL,
};