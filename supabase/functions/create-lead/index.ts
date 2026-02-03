import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CreateLeadRequest {
  full_name: string
  email?: string | null
  phone: string
  notes?: string | null
  privacy_accepted: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: CreateLeadRequest = await req.json()
    const { full_name, email, phone, notes, privacy_accepted } = body

    // Validate required fields
    if (!full_name?.trim() || !phone?.trim() || privacy_accepted !== true) {
      return new Response(
        JSON.stringify({ error: 'missing_fields', message: 'חסרים שדות חובה' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: full_name.trim(),
        phone: phone.trim(),
        email: email || null,
        notes: notes || null,
        status: 'new',
        is_complete: false,
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
