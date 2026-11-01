import { supabase } from './supabase';

export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  return response;
}
