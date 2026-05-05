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
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !requester) {
      console.error('Auth error or user not found:', authError)
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

    // --- PING ACTION (Diagnosis) ---
    if (action === 'ping') {
      return new Response(JSON.stringify({ 
        ok: true, 
        user: requester.email, 
        role: requesterProfile.papel,
        status: requesterProfile.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

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

      // Check if user already exists
      const { data: existingProfiles, error: checkError } = await supabaseClient
        .from('profiles')
        .select('id, nome, email')
        .eq('email', email)
        .maybeSingle()

      let userId = ''
      let isNewUser = false

      if (existingProfiles) {
        // User exists, just add link to the school
        userId = existingProfiles.id
        console.log(`[MANAGE-USER] User ${email} already exists with ID ${userId}. Adding link to school ${escola_id}.`)
      } else {
        // Create user in Auth
        const { data: authUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: nome }
        })

        if (createAuthError) throw createAuthError
        userId = authUser.user.id
        isNewUser = true

        // Create profile using the same ID
        const { error: createProfileError } = await supabaseClient
          .from('profiles')
          .insert([{
            id: userId,
            nome,
            email,
            papel,
            escola_id, // keep for backward compatibility
            status: status || 'ativo',
            disciplinas: disciplinas || []
          }])

        if (createProfileError) {
          // Rollback auth user if profile creation fails
          await supabaseClient.auth.admin.deleteUser(userId)
          throw createProfileError
        }
      }

      // Create link in profile_escolas
      const { error: linkError } = await supabaseClient
        .from('profile_escolas')
        .insert([{
          profile_id: userId,
          escola_id,
          papel,
          status: status || 'ativo',
          disciplinas: disciplinas || []
        }])
        .select()
        .single()

      if (linkError) {
        if (linkError.code === '23505') { // unique_violation
          return new Response(JSON.stringify({ 
            error: 'Este usuário já possui vínculo com esta escola.',
            code: 'ALREADY_LINKED'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        throw linkError
      }

      return new Response(JSON.stringify({ 
        userId, 
        isNewUser, 
        message: isNewUser ? 'Usuário criado com sucesso.' : 'Vínculo adicionado ao usuário existente.' 
      }), {
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

      // Check if we are updating a link (escola_id provided) or the global profile
      // In this new architecture, "update" usually refers to the context of the active school
      
      if (isAdminLab) {
        // Admin Lab can only update users they are linked to in the same school
        const { data: link, error: linkError } = await supabaseClient
          .from('profile_escolas')
          .select('*')
          .eq('profile_id', id)
          .eq('escola_id', requesterProfile.escola_id)
          .single()
        
        if (linkError || !link) {
          throw new Error('Unauthorized: Admin Lab can only update users linked to their school')
        }

        if (link.papel !== 'professor' && id !== requester.id) {
           throw new Error('Admin Lab can only update professor accounts or their own')
        }
      }

      // Update Auth if email changed
      if (email && email !== targetProfile.email) {
        const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(id, { email })
        if (updateAuthError) throw updateAuthError
      }
      
      if (nome) {
        await supabaseClient.auth.admin.updateUserById(id, { user_metadata: { full_name: nome } })
      }

      // Update Global Profile (basic info)
      const profileUpdate: any = {}
      if (nome) profileUpdate.nome = nome
      if (email) profileUpdate.email = email
      
      if (Object.keys(profileUpdate).length > 0) {
        const { error: updateProfileError } = await supabaseClient
          .from('profiles')
          .update(profileUpdate)
          .eq('id', id)
        if (updateProfileError) throw updateProfileError
      }

      // Update specific school link if escola_id is present
      if (escola_id) {
        const linkUpdate: any = {}
        if (papel) linkUpdate.papel = papel
        if (status) linkUpdate.status = status
        if (disciplinas) linkUpdate.disciplinas = disciplinas

        const { error: updateLinkError } = await supabaseClient
          .from('profile_escolas')
          .update(linkUpdate)
          .eq('profile_id', id)
          .eq('escola_id', escola_id)
        
        if (updateLinkError) throw updateLinkError
      }

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
      const { id, escola_id } = userData

      if (!id || !escola_id) throw new Error('Missing id or escola_id')

      if (isAdminLab && escola_id !== requesterProfile.escola_id) {
        throw new Error('Unauthorized: Admin Lab can only manage users in their own school')
      }

      // Strategy: Update status to 'removido' in the specific link
      const { error: blockError } = await supabaseClient
        .from('profile_escolas')
        .update({ status: 'removido' })
        .eq('profile_id', id)
        .eq('escola_id', escola_id)

      if (blockError) throw blockError
      
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
