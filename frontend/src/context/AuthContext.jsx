import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  async function loadMembership(userId) {
    if (!supabase || !userId) {
      setMembership(null);
      return;
    }
    let { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, status, organizations(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    const pendingOrganizationName = window.sessionStorage.getItem('pending_organization_name');
    if (!data && !error && pendingOrganizationName) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { organization_name: pendingOrganizationName },
      });
      if (!metadataError) {
        const { error: bootstrapError } = await supabase.rpc('bootstrap_current_user');
        if (bootstrapError) console.error('Unable to create the Google organization', bootstrapError);
        window.sessionStorage.removeItem('pending_organization_name');
        const membershipResult = await supabase
          .from('organization_members')
          .select('organization_id, role, status, organizations(name)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        data = membershipResult.data;
        error = membershipResult.error;
      } else {
        console.error('Unable to save the Google organization name', metadataError);
      }
    }
    if (error) {
      console.error('Unable to load organization membership', error);
      setMembership(null);
      return;
    }
    setMembership(data);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore Supabase session', error);
      if (active) {
        setSession(data.session);
        loadMembership(data.session?.user?.id);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadMembership(nextSession?.user?.id);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    membership,
    role: membership?.role ?? null,
    organization: membership?.organizations ?? null,
    loading,
    configured: Boolean(supabase),
    signOut: () => supabase?.auth.signOut(),
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
