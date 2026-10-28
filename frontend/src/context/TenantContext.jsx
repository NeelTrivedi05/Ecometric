import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ACCOUNTS_DATA } from '../data/accountsData';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract orgSlug from URL if in /console/:orgSlug/*
  const consoleMatch = location.pathname.match(/^\/console\/([^/]+)/);
  const currentRouteSlug = consoleMatch && consoleMatch[1] !== 'undefined' ? consoleMatch[1] : null;

  const [memberships, setMemberships] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback mock accounts for offline/demo/preview testing
  const mockMemberships = useMemo(() => {
    return Object.values(ACCOUNTS_DATA).map((acc) => ({
      organization_id: acc.id,
      role: 'account_admin',
      status: 'active',
      organizations: {
        id: acc.id,
        name: acc.company_name,
        slug: acc.id,
        logo_url: null,
        settings: {
          default_methodology: 'TRACI 2.1',
          pcr_standard: acc.database_assembly?.pcr_standard || 'UL 10010-4 Part B & EN 15804+A2',
          facility_name: acc.facility_name,
          facility_location: acc.facility_location,
          company_address: acc.company_address,
          company_website: acc.company_website,
        },
        created_at: new Date().toISOString(),
      },
    }));
  }, []);

  const loadTenantData = useCallback(async (isRetry = false) => {
    let storedSlug = window.localStorage.getItem('ecometric_active_org_slug');
    if (storedSlug === 'undefined' || storedSlug === 'null' || !storedSlug) {
      storedSlug = 'carrier-hvac';
    }

    if (!user?.id) {
      // If no auth user yet, fallback to mock demo memberships
      setMemberships(mockMemberships);
      const targetSlug = currentRouteSlug || storedSlug;
      let resolved = mockMemberships.find((m) => m.organizations?.slug === targetSlug || m.organization_id === targetSlug);

      if (!resolved && currentRouteSlug) {
        const title = currentRouteSlug
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const dynamicMock = {
          organization_id: currentRouteSlug,
          role: 'account_admin',
          status: 'active',
          organizations: {
            id: currentRouteSlug,
            name: title || 'EcoMetric Organization',
            slug: currentRouteSlug,
            logo_url: null,
            settings: {
              default_methodology: 'TRACI 2.1',
              pcr_standard: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
              facility_name: `${title} Facility`,
              facility_location: 'Syracuse, NY, USA',
              company_address: 'One Carrier Place, Farmington, CT 06032, USA',
              company_website: `https://${currentRouteSlug}.com`,
            },
            created_at: new Date().toISOString(),
          },
        };
        setMemberships([dynamicMock, ...mockMemberships]);
        setActiveOrg({ ...dynamicMock.organizations, role: 'account_admin' });
        window.localStorage.setItem('ecometric_active_org_slug', currentRouteSlug);
        setLoading(false);
        return;
      }

      resolved = resolved || mockMemberships[0];
      setActiveOrg(resolved ? { ...resolved.organizations, role: resolved.role } : null);
      if (resolved?.organizations?.slug) {
        window.localStorage.setItem('ecometric_active_org_slug', resolved.organizations.slug);
      }
      setLoading(false);
      return;
    }

    if (!supabase) {
      setMemberships(mockMemberships);
      setActiveOrg({ ...mockMemberships[0].organizations, role: mockMemberships[0].role });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's active organization memberships
      const { data: memberRows, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            slug,
            logo_url,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) {
        console.warn('Supabase members fetch error, falling back to mock tenant data:', memberError);
        setMemberships(mockMemberships);
        setActiveOrg({ ...mockMemberships[0].organizations, role: mockMemberships[0].role });
        setLoading(false);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
        if (!isRetry) {
          // Attempt to auto-bootstrap an organization for this user in DB
          const orgTitle =
            user.user_metadata?.organization_name ||
            user.user_metadata?.full_name ||
            (user.email ? user.email.split('@')[0] + ' Org' : 'EcoMetric Organization');

          const { data: bootstrappedId, error: rpcError } = await supabase.rpc('bootstrap_current_user');
          if (!rpcError && bootstrappedId) {
            return loadTenantData(true);
          }

          // Try direct create_organization_with_admin fallback
          const { data: newOrgId } = await supabase.rpc('create_organization_with_admin', {
            org_name: orgTitle,
          });
          if (newOrgId) {
            return loadTenantData(true);
          }
        }

        // Fallback to demo orgs for testing if no rows in DB
        setMemberships(mockMemberships);
        const targetSlug = currentRouteSlug || storedSlug;
        const resolved = mockMemberships.find((m) => m.organizations?.slug === targetSlug) || mockMemberships[0];
        setActiveOrg({ ...resolved.organizations, role: resolved.role });
        setLoading(false);
        return;
      }

      const normalizedMembers = memberRows.map((m) => {
        const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
        return {
          ...m,
          organizations: org,
        };
      });

      setMemberships(normalizedMembers);

      // Resolve active organization
      let target = null;
      if (currentRouteSlug) {
        target = normalizedMembers.find((m) => m.organizations?.slug === currentRouteSlug || m.organization_id === currentRouteSlug);
      }
      if (!target && storedSlug) {
        target = normalizedMembers.find((m) => m.organizations?.slug === storedSlug || m.organization_id === storedSlug);
      }
      if (!target && normalizedMembers.length > 0) {
        target = normalizedMembers[0];
      }

      if (target?.organizations) {
        const enrichedOrg = {
          ...target.organizations,
          role: target.role || 'account_admin',
        };
        setActiveOrg(enrichedOrg);
        window.localStorage.setItem('ecometric_active_org_slug', target.organizations.slug);
      } else if (currentRouteSlug) {
        const title = currentRouteSlug
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const fallbackOrg = {
          id: currentRouteSlug,
          name: title || 'EcoMetric Organization',
          slug: currentRouteSlug,
          logo_url: null,
          role: 'account_admin',
          settings: {
            default_methodology: 'TRACI 2.1',
            pcr_standard: 'UL 10010-4 Part B v2.0 & EN 15804+A2',
            company_address: 'One Carrier Place, Farmington, CT 06032, USA',
            company_website: `https://${currentRouteSlug}.com`,
          },
          created_at: new Date().toISOString(),
        };
        setActiveOrg(fallbackOrg);
        window.localStorage.setItem('ecometric_active_org_slug', currentRouteSlug);
      }
    } catch (err) {
      console.error('Failed to load tenant state:', err);
      setError(err.message);
      setMemberships(mockMemberships);
      setActiveOrg({ ...mockMemberships[0].organizations, role: mockMemberships[0].role });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentRouteSlug, mockMemberships]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  // Synchronize when route currentRouteSlug changes
  useEffect(() => {
    if (currentRouteSlug && memberships.length > 0) {
      const match = memberships.find((m) => {
        const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
        return org?.slug === currentRouteSlug || m.organization_id === currentRouteSlug;
      });
      if (match && match.organizations?.id !== activeOrg?.id) {
        const orgObj = Array.isArray(match.organizations) ? match.organizations[0] : match.organizations;
        if (orgObj) {
          setActiveOrg({ ...orgObj, role: match.role });
          window.localStorage.setItem('ecometric_active_org_slug', orgObj.slug);
        }
      }
    }
  }, [currentRouteSlug, memberships, activeOrg?.id]);

  const switchOrganization = useCallback(
    (slugOrId, redirect = true) => {
      const target = memberships.find(
        (m) => m.organizations?.slug === slugOrId || m.organizations?.id === slugOrId
      );
      if (target?.organizations) {
        setActiveOrg({ ...target.organizations, role: target.role });
        window.localStorage.setItem('ecometric_active_org_slug', target.organizations.slug);
        if (redirect) {
          navigate(`/console/${target.organizations.slug}/overview`);
        }
      }
    },
    [memberships, navigate]
  );

  const createOrganization = useCallback(
    async (name, customSlug = '') => {
      if (!name?.trim()) throw new Error('Organization name is required');
      if (supabase && user?.id) {
        const { data: orgId, error: rpcErr } = await supabase.rpc('create_organization_with_admin', {
          org_name: name.trim(),
          org_slug: customSlug.trim() || null,
        });
        if (rpcErr) throw rpcErr;
        await loadTenantData();
        return orgId;
      } else {
        // Local simulation
        const generatedSlug = (customSlug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const newOrg = {
          organization_id: `org-${Date.now()}`,
          role: 'account_admin',
          status: 'active',
          organizations: {
            id: `org-${Date.now()}`,
            name,
            slug: generatedSlug,
            logo_url: null,
            settings: {
              default_methodology: 'TRACI 2.1',
              pcr_standard: 'UL 10010-4 Part B & EN 15804+A2',
            },
            created_at: new Date().toISOString(),
          },
        };
        setMemberships((prev) => [newOrg, ...prev]);
        setActiveOrg({ ...newOrg.organizations, role: 'account_admin' });
        window.localStorage.setItem('ecometric_active_org_slug', generatedSlug);
        navigate(`/console/${generatedSlug}/overview`);
        return newOrg.organizations.id;
      }
    },
    [user?.id, loadTenantData, navigate]
  );

  const userRole = activeOrg?.role || 'member';
  const isAccountAdmin = userRole === 'account_admin';
  const isManager = userRole === 'account_admin' || userRole === 'manager';

  const value = useMemo(
    () => ({
      activeOrg,
      memberships,
      userRole,
      isAccountAdmin,
      isManager,
      isMember: Boolean(activeOrg),
      loading,
      error,
      switchOrganization,
      createOrganization,
      refreshTenant: loadTenantData,
    }),
    [
      activeOrg,
      memberships,
      userRole,
      isAccountAdmin,
      isManager,
      loading,
      error,
      switchOrganization,
      createOrganization,
      loadTenantData,
    ]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

