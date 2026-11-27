import { supabase } from './supabase';

/**
 * Canonical domain for production EcoMetric application.
 * All authentication, signup confirmation, and invitation email links
 * must use this domain to avoid hitting Vercel's Deployment Protection screen.
 */
export const CANONICAL_DOMAIN = 'https://ecometric-in.vercel.app';

/**
 * Returns the base redirect URL.
 * In local development (localhost / 127.0.0.1), preserves origin.
 * In all deployed/production/preview environments, uses CANONICAL_DOMAIN.
 */
export function getRedirectBaseUrl() {
  const envUrl = (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SITE_URL || import.meta.env.VITE_PUBLIC_SITE_URL)
  )?.trim().replace(/\/+$/, '');

  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return origin;
    }
  }

  return CANONICAL_DOMAIN;
}

/**
 * Formats an absolute redirect URL with the given path on the canonical domain.
 * @param {string} path - Target path e.g. '/console' or '/reset-password'
 * @returns {string} - e.g. 'https://ecometric-in.vercel.app/console'
 */
export function getAuthRedirectUrl(path = '/console') {
  const base = getRedirectBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Formats auth error messages into user-friendly notices.
 */
export function formatAuthError(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  if (/password should|password must|password.*character/i.test(message)) {
    return 'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a special character.';
  }
  return message;
}

/**
 * Resolves active organization slug from Supabase for a given user.
 */
export async function resolveUserOrgSlug(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data } = await supabase
      .from('organization_members')
      .select('organizations(slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    return data?.organizations?.slug || null;
  } catch (err) {
    console.warn('resolveUserOrgSlug note:', err);
    return null;
  }
}

/**
 * Processes pending invitation acceptance when user authenticates.
 */
export async function processInviteAcceptance(userId, email, token, orgSlug) {
  if (!supabase || !userId) return;
  try {
    // 1. Try Supabase RPC function (runs with SECURITY DEFINER in PostgreSQL)
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('accept_organization_invite', { p_token: token });
      if (!rpcErr && rpcRes?.success) {
        return;
      }
    }

    // 2. Direct Supabase table upsert fallback
    const normalizedEmail = (email || '').trim().toLowerCase();
    const { data: invRows } = await supabase
      .from('organization_invites')
      .select('id, organization_id, role')
      .eq('email', normalizedEmail)
      .is('accepted_at', null);

    if (invRows && invRows.length > 0) {
      for (const inv of invRows) {
        await supabase.from('organization_members').upsert({
          organization_id: inv.organization_id,
          user_id: userId,
          role: inv.role || 'member',
          status: 'active',
        }, { onConflict: 'organization_id,user_id' });

        await supabase
          .from('organization_invites')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', inv.id);

        await supabase
          .from('profiles')
          .update({ default_org_id: inv.organization_id })
          .eq('id', userId);
      }
    }
  } catch (err) {
    console.warn('Error accepting invitation in Supabase:', err);
  }
}

