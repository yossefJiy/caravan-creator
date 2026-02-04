import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface UpdateLeadRequest {
  leadId: string
  full_name?: string
  email?: string | null
  phone?: string
  id_number?: string | null
  notes?: string | null
  selected_truck_type?: string | null
  selected_truck_size?: string | null
  selected_equipment?: string[] | null
  is_complete?: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: UpdateLeadRequest = await req.json()
    const { leadId, ...updateData } = body

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // First verify the lead exists and check if it was already complete
    const { data: existingLead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('id, is_complete')
      .eq('id', leadId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching lead:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to find lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!existingLead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this is a new completion (was not complete, now becoming complete)
    const wasComplete = existingLead.is_complete
    const isBecomingComplete = updateData.is_complete === true && !wasComplete

    // Update the lead
    const { data, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select('id')
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If lead is becoming complete, automatically create price quote and notify business
    if (isBecomingComplete) {
      console.log('Lead completed, creating automatic price quote...')
      
      // Create price quote automatically (without sending to client)
      try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        const quoteResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-price-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ leadId, sendEmail: false }),
        })
        
        if (quoteResponse.ok) {
          const quoteResult = await quoteResponse.json()
          console.log('Price quote created automatically:', quoteResult)
        } else {
          const quoteError = await quoteResponse.text()
          console.error('Error creating automatic price quote:', quoteError)
        }
      } catch (quoteError) {
        console.error('Error calling create-price-quote:', quoteError)
        // Don't fail the whole request, quote creation is a bonus
      }

      // Send notification to business owners
      try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        const notifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-lead-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ leadId }),
        })
        
        if (notifyResponse.ok) {
          console.log('Business notification sent successfully')
        } else {
          const notifyError = await notifyResponse.text()
          console.error('Error sending business notification:', notifyError)
        }
      } catch (notifyError) {
        console.error('Error calling send-lead-notification:', notifyError)
        // Don't fail the whole request
      }
    }

    return new Response(
      JSON.stringify({ success: true, leadId: data.id }),
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