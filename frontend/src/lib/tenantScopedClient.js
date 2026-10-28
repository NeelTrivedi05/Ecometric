import { supabase } from './supabase';

/**
 * Multi-Tenant Data Access Layer for EcoMetric LCA & EPD Studio
 * Guarantees zero cross-tenant leakage by binding all queries and realtime channels
 * strictly to activeOrg.id (paired with database-level RLS).
 */

/**
 * Builds a query scoped to the specified organization_id.
 * @param {string} table - Table name (e.g. 'projects', 'results', 'reports')
 * @param {string} organizationId - UUID of the active organization
 * @param {string} selectClause - Columns to select (default: '*')
 */
export function getScopedQuery(table, organizationId, selectClause = '*') {
  if (!supabase) throw new Error('Supabase client is not initialized.');
  if (!organizationId) throw new Error('Cannot execute query without active organizationId.');

  return supabase
    .from(table)
    .select(selectClause)
    .eq('organization_id', organizationId);
}

/**
 * Creates an insert operation automatically injecting the active organization_id.
 * @param {string} table - Table name
 * @param {string} organizationId - UUID of the active organization
 * @param {object|array} recordOrRecords - Payload(s) to insert
 */
export async function insertScopedRecord(table, organizationId, recordOrRecords) {
  if (!supabase) throw new Error('Supabase client is not initialized.');
  if (!organizationId) throw new Error('Cannot insert without active organizationId.');

  const payload = Array.isArray(recordOrRecords)
    ? recordOrRecords.map((r) => ({ ...r, organization_id: organizationId }))
    : { ...recordOrRecords, organization_id: organizationId };

  return supabase.from(table).insert(payload).select();
}

/**
 * Subscribe to realtime changes scoped to an organization_id channel.
 * Supabase Realtime filters by `organization_id=eq.${organizationId}` to avoid
 * transmitting other tenants' events over WebSocket.
 *
 * @param {string} table - Table name
 * @param {string} organizationId - UUID of the active organization
 * @param {function} onEvent - Callback for incoming change payload
 * @returns {RealtimeChannel} - Subscribed Supabase channel instance
 */
export function subscribeToScopedTable(table, organizationId, onEvent) {
  if (!supabase || !organizationId) return null;

  const channelName = `org-${organizationId}:${table}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        if (typeof onEvent === 'function') {
          onEvent(payload);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Storage Path Resolver: Files are strictly saved under `/{organization_id}/{filename}`
 * Matching the Supabase Storage RLS policy `(storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())`
 */
export const TenantStorage = {
  getFilePath(organizationId, fileName) {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${organizationId}/${Date.now()}_${cleanFileName}`;
  },

  async uploadEpdArtifact(organizationId, file, customName = null) {
    if (!supabase) throw new Error('Supabase client is not initialized.');
    const path = this.getFilePath(organizationId, customName || file.name);

    const { data, error } = await supabase.storage
      .from('epd-artifacts')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  async getSignedArtifactUrl(filePath, expiresInSeconds = 3600) {
    if (!supabase) throw new Error('Supabase client is not initialized.');
    const { data, error } = await supabase.storage
      .from('epd-artifacts')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) throw error;
    return data?.signedUrl;
  },
};

