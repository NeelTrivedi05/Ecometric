/**
 * EcoMetric API Configuration
 *
 * In local development:
 * - Defaults to '/api' which Vite proxies to http://127.0.0.1:8000
 *
 * In production (e.g. on Vercel):
 * - If VITE_API_URL or VITE_API_BASE_URL is set (e.g. "https://ecometric-backend.onrender.com"),
 *   API_BASE resolves to "https://ecometric-backend.onrender.com/api".
 * - If deploying with Vercel rewrites proxying /api directly to the backend,
 *   leave VITE_API_URL empty and it will default to '/api'.
 */

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
