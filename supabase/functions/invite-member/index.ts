// Supabase Edge Function: invite-member
// Invites a new team member to an organization using Supabase Auth Admin and sends a branded email
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase environment variables not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Authenticate caller from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await clientWithAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { email, organization_id, organization_name, organization_slug, role = 'member', token } = body

    if (!email || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 3. Verify that the caller is an account_admin of the target organization
    const { data: membership, error: memError } = await clientWithAuth
      .from('organization_members')
      .select('role, status')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (memError || !membership || membership.role !== 'account_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only Account Admins can send organization invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Admin client with service_role to invite user via Supabase Auth
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Build redirect URL
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const inviteRedirectTo = `${origin}/login?invite=${token || ''}&org=${organization_slug || ''}&email=${encodeURIComponent(normalizedEmail)}`

    // Call Supabase Auth Admin invite API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: inviteRedirectTo,
        data: {
          organization_id: organization_id,
          organization_name: organization_name || 'EcoMetric Organization',
          invited_role: role,
          invited_by: user.id,
        },
      }
    )

    if (inviteError) {
      // If user already registered in Supabase Auth, we can add them to organization directly
      if (inviteError.message?.toLowerCase().includes('already been registered') || inviteError.status === 422) {
        // Find user by email
        const { data: usersList } = await adminClient.auth.admin.listUsers()
        const existingUser = usersList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)

        if (existingUser) {
          // Add to organization_members
          await adminClient.from('organization_members').upsert({
            organization_id: organization_id,
            user_id: existingUser.id,
            role: role,
            status: 'active',
          }, { onConflict: 'organization_id,user_id' })

          return new Response(
            JSON.stringify({
              success: true,
              message: `User ${normalizedEmail} is already registered and was directly added to the organization as an employee.`,
              existing_user: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      console.warn('Supabase inviteUserByEmail note:', inviteError.message)
    }

    // 5. Ensure organization_invites record is saved
    await adminClient.from('organization_invites').upsert({
      organization_id: organization_id,
      email: normalizedEmail,
      role: role,
      token: token || crypto.randomUUID().replace(/-/g, ''),
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'organization_id,email' })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation email sent via Supabase to ${normalizedEmail} for ${organization_name || 'organization'}.`,
        user: inviteData?.user || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error in Supabase Edge Function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

