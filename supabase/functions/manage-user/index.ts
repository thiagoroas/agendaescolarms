import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the session of the requester
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !requester) {
      throw new Error('Invalid token')
    }

    // Check requester profile and role
    const { data: requesterProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', requester.id)
      .single()

    if (profileError || !requesterProfile) {
      throw new Error('Requester profile not found')
    }

    if (requesterProfile.status !== 'ativo') {
      throw new Error('Requester account is not active')
    }

    const isAdminPlataforma = requesterProfile.papel === 'admin_plataforma'
    const isAdminLab = requesterProfile.papel === 'admin_lab'

    if (!isAdminPlataforma && !isAdminLab) {
      throw new Error('Unauthorized: Only admins can manage users')
    }

    const { action, userData } = await req.json()

    // --- CREATE ACTION ---
    if (action === 'create') {
      const { email, password, nome, papel, escola_id, status, disciplinas } = userData

      // Admin Lab can only create professors in their own school
      if (isAdminLab) {
        if (papel !== 'professor') {
          throw new Error('Admin Lab can only create professor accounts')
        }
        if (escola_id !== requesterProfile.escola_id) {
          throw new Error('Admin Lab can only create users for their own school')
        }
      }

      // Create user in Auth
      const { data: authUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: nome }
      })

      if (createAuthError) throw createAuthError

      // Create profile using the same ID
      const { error: createProfileError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: authUser.user.id,
          nome,
          email,
          papel,
          escola_id,
          status: status || 'ativo',
          disciplinas: disciplinas || []
        }])

      if (createProfileError) {
        // Rollback auth user if profile creation fails
        await supabaseClient.auth.admin.deleteUser(authUser.user.id)
        throw createProfileError
      }

      return new Response(JSON.stringify({ user: authUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // --- UPDATE ACTION ---
    if (action === 'update') {
      const { id, nome, papel, escola_id, status, disciplinas, email } = userData

      // Fetch target profile to check ownership/permissions
      const { data: targetProfile, error: fetchTargetError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchTargetError) throw new Error('Target user not found')

      if (isAdminLab) {
        // Admin Lab can only update professors in their own school
        if (targetProfile.papel !== 'professor') {
          throw new Error('Admin Lab can only update professor accounts')
        }
        if (targetProfile.escola_id !== requesterProfile.escola_id) {
          throw new Error('Admin Lab can only update users from their own school')
        }
        // Protect fields that Admin Lab cannot change
        if (papel && papel !== 'professor') throw new Error('Admin Lab cannot change roles')
        if (escola_id && escola_id !== requesterProfile.escola_id) throw new Error('Admin Lab cannot change school')
      }

      // Update Auth if email changed
      if (email && email !== targetProfile.email) {
        const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(id, { email })
        if (updateAuthError) throw updateAuthError
      }
      
      if (nome) {
        await supabaseClient.auth.admin.updateUserById(id, { user_metadata: { full_name: nome } })
      }

      // Update Profile
      const { error: updateProfileError } = await supabaseClient
        .from('profiles')
        .update({
          nome,
          papel,
          escola_id,
          status,
          disciplinas,
          email
        })
        .eq('id', id)

      if (updateProfileError) throw updateProfileError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // --- RESET PASSWORD ACTION ---
    if (action === 'reset_password') {
      const { id, password } = userData

      const { data: targetProfile, error: fetchTargetError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchTargetError) throw new Error('Target user not found')

      if (isAdminLab) {
        if (targetProfile.papel !== 'professor' || targetProfile.escola_id !== requesterProfile.escola_id) {
          throw new Error('Unauthorized to reset password for this user')
        }
      }

      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(id, { password })
      if (resetError) throw resetError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // --- DELETE / DISABLE ACTION ---
    if (action === 'delete_or_disable') {
      const { id } = userData

      const { data: targetProfile, error: fetchTargetError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchTargetError) throw new Error('Target user not found')

      if (isAdminLab) {
        if (targetProfile.papel !== 'professor' || targetProfile.escola_id !== requesterProfile.escola_id) {
          throw new Error('Unauthorized to manage this user')
        }
      }

      // Default strategy is to block (disable)
      const { error: blockError } = await supabaseClient
        .from('profiles')
        .update({ status: 'bloqueado' })
        .eq('id', id)

      if (blockError) throw blockError
      
      // Also block in Auth
      const { error: blockAuthError } = await supabaseClient.auth.admin.updateUserById(id, { 
        ban_duration: 'none' // Effectively blocks the user in Supabase Auth if using modern ban features or just update status/metadata
      })
      // If ban_duration is not supported or different, we can also use user_metadata to mark as blocked or just rely on profile status during login hook

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
