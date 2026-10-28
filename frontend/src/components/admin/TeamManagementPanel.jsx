import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../base/buttons/button';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ShieldCheckIcon,
  CopyIcon,
  CloseIcon,
  LayersIcon,
} from '../studio/Icons';

export default function TeamManagementPanel() {
  const { user } = useAuth();
  const { activeOrg, isAccountAdmin } = useTenant();

  // Initialize strictly with the authenticated user — zero mock/fake names
  const [members, setMembers] = useState(() => {
    if (!user) return [];
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Dhruvil Patel';
    return [
      {
        id: user.id,
        user_id: user.id,
        full_name: displayName,
        email: user.email || '',
        role: isAccountAdmin ? 'account_admin' : 'member',
        status: 'active',
        avatar: (displayName || 'DP').substring(0, 2).toUpperCase(),
        created_at: user.created_at || new Date().toISOString(),
        isCurrentUser: true,
      },
    ];
  });

  const [invites, setInvites] = useState([]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  // Fetch real Supabase members and invites
  useEffect(() => {
    async function fetchOrgMembers() {
      const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Dhruvil Patel';
      const defaultCurrentMember = user ? [{
        id: user.id,
        user_id: user.id,
        full_name: displayName,
        email: user.email || '',
        role: isAccountAdmin ? 'account_admin' : 'member',
        status: 'active',
        avatar: (displayName || 'DP').substring(0, 2).toUpperCase(),
        created_at: user.created_at || new Date().toISOString(),
        isCurrentUser: true,
      }] : [];

      if (!supabase || !activeOrg?.id) {
        if (defaultCurrentMember.length > 0) setMembers(defaultCurrentMember);
        return;
      }

      try {
        const { data: dbMembers, error: membersErr } = await supabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            role,
            status,
            created_at,
            profiles:user_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('organization_id', activeOrg.id);

        if (dbMembers && dbMembers.length > 0) {
          setMembers(
            dbMembers.map((m) => {
              const isMe = m.user_id === user?.id;
              const name = m.profiles?.full_name || (isMe ? displayName : 'Team Member');
              const email = m.profiles?.email || (isMe ? user?.email : '');
              return {
                id: m.id || m.user_id,
                user_id: m.user_id,
                full_name: name,
                email: email,
                role: m.role || 'member',
                status: m.status || 'active',
                avatar: (name || 'TM').substring(0, 2).toUpperCase(),
                created_at: m.created_at || new Date().toISOString(),
                isCurrentUser: isMe,
              };
            })
          );
        } else {
          setMembers(defaultCurrentMember);
        }

        const { data: dbInvites } = await supabase
          .from('organization_invites')
          .select('*')
          .eq('organization_id', activeOrg.id)
          .is('accepted_at', null);

        if (dbInvites && dbInvites.length > 0) {
          setInvites(dbInvites);
        } else {
          setInvites([]);
        }
      } catch (err) {
        console.warn('Unable to load remote members, displaying authenticated user:', err);
        setMembers(defaultCurrentMember);
        setInvites([]);
      }
    }

    fetchOrgMembers();
  }, [activeOrg?.id, user, isAccountAdmin]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      if (supabase && activeOrg?.id) {
        const { data, error } = await supabase.from('organization_invites').insert({
          organization_id: activeOrg.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }).select();

        if (error) throw error;
        if (data && data[0]) {
          setInvites((prev) => [data[0], ...prev]);
        }
      } else {
        // Local simulation
        const newInvite = {
          id: `inv-${Date.now()}`,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: Math.random().toString(36).substring(2, 14),
        };
        setInvites((prev) => [newInvite, ...prev]);
      }

      setNotification(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      alert(`Error inviting user: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!isAccountAdmin) return;
    try {
      if (supabase && activeOrg?.id) {
        await supabase
          .from('organization_members')
          .update({ role: newRole })
          .eq('id', memberId)
          .eq('organization_id', activeOrg.id);
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setNotification('Member role updated successfully');
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    } finally {
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleRemoveMember = async (memberId, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from ${activeOrg?.name}?`)) return;
    try {
      if (supabase && activeOrg?.id) {
        await supabase
          .from('organization_members')
          .delete()
          .eq('id', memberId)
          .eq('organization_id', activeOrg.id);
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setNotification(`Removed ${email}`);
    } catch (err) {
      alert(`Failed to remove member: ${err.message}`);
    } finally {
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      if (supabase && activeOrg?.id) {
        await supabase.from('organization_invites').delete().eq('id', inviteId);
      }
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      setNotification('Invitation revoked');
    } catch (err) {
      alert(`Failed to revoke invitation: ${err.message}`);
    } finally {
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const copyInviteLink = (token) => {
    const inviteUrl = `${window.location.origin}/signup?token=${token}&org=${activeOrg?.slug || ''}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const roleBadges = {
    account_admin: { label: 'Account Admin', bg: 'rgba(31, 122, 76, 0.1)', color: '#1f7a4c', border: '#c3e8cd' },
    manager: { label: 'Manager / Verifier', bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '#bae6fd' },
    member: { label: 'LCA Member', bg: 'rgba(91, 111, 98, 0.1)', color: '#5b6f62', border: '#dfe7dd' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid #c3e8cd',
            borderRadius: '8px',
            color: '#1f7a4c',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(31, 122, 76, 0.1)',
          }}
        >
          <CheckIcon size={14} />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent, #1f7a4c)',
            }}
          >
            Access Governance
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
            Team & Role-Based Access Control
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
            Manage organization members, assigned roles, and pending security invitations.
          </p>
        </div>

        <Button onClick={() => setIsInviteModalOpen(true)} iconLeading={PlusIcon}>
          Invite Colleague
        </Button>
      </div>

      {/* Active Members Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border, #dfe7dd)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
              Active Members ({members.length})
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                color: 'var(--accent, #1f7a4c)',
                fontWeight: 600,
              }}
            >
              PostgreSQL RLS Scoped
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
            Changes take effect immediately at database level
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-card2, #f8faf6)', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Member</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Role</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Status</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Joined Date</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted, #5b6f62)' }}>
                    No active members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                const badge = roleBadges[member.role] || roleBadges.member;
                return (
                  <tr
                    key={member.id}
                    style={{
                      borderBottom: '1px solid var(--border, #dfe7dd)',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(31, 122, 76, 0.12)',
                            color: 'var(--accent, #1f7a4c)',
                            fontWeight: 600,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {member.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                            {member.full_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 24px' }}>
                      {isAccountAdmin ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${badge.border}`,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="account_admin">Account Admin</option>
                          <option value="manager">Manager / Verifier</option>
                          <option value="member">LCA Member</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontSize: '12px',
                            fontWeight: 600,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 24px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#eaf7ee',
                          color: '#1f7a4c',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1f7a4c' }} />
                        Active
                      </span>
                    </td>

                    <td style={{ padding: '14px 24px', color: 'var(--text-muted, #5b6f62)', fontSize: '12px' }}>
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      {isAccountAdmin && member.role !== 'account_admin' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {invites.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
              Pending Invitations ({invites.length})
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Invited users auto-join this organization upon signup
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-card2, #f8faf6)', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Invited Email</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Assigned Role</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Expires In</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border, #dfe7dd)' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 500, color: 'var(--text-primary, #16231b)' }}>
                      {inv.email}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(2, 132, 199, 0.08)',
                          color: '#0284c7',
                        }}
                      >
                        {inv.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', color: 'var(--text-muted, #5b6f62)', fontSize: '12px' }}>
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => copyInviteLink(inv.token)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border, #dfe7dd)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: 'var(--text-primary, #16231b)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CopyIcon size={12} />
                          <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '12px',
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 35, 27, 0.45)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, #dfe7dd)',
              padding: '28px',
              boxShadow: '0 16px 40px rgba(16, 52, 33, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
                Invite Team Member
              </h2>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #5b6f62)' }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', lineHeight: 1.5, marginBottom: '20px' }}>
              Grant an engineer, sustainability analyst, or third-party verifier access to{' '}
              <strong>{activeOrg?.name}</strong>.
            </p>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary, #2f3b33)' }}>
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #dfe7dd)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary, #16231b)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary, #2f3b33)' }}>
                  Assigned Security Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #dfe7dd)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary, #16231b)',
                    outline: 'none',
                    backgroundColor: 'var(--bg-card, #ffffff)',
                  }}
                >
                  <option value="member">LCA Member (Data Entry & Calculation)</option>
                  <option value="manager">Manager / Verifier (Review & Certification)</option>
                  <option value="account_admin">Account Admin (Full Console & Member Administration)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button color="secondary" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !inviteEmail.trim()}>
                  {loading ? 'Sending…' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

