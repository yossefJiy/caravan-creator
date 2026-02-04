import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MORNING_API_URL = 'https://api.greeninvoice.co.il/api/v1';

interface IncomeItem {
  description: string;
  quantity: number;
  price: number;
  vatType: number;
}

interface MorningClient {
  name: string;
  phone?: string;
  emails?: string[];
  add: boolean;
}

interface MorningDocumentRequest {
  type: number;
  lang: string;
  currency: string;
  vatType: number;
  client: MorningClient;
  income: IncomeItem[];
  remarks?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GREEN_INVOICE_API_KEY_ID = Deno.env.get('GREEN_INVOICE_API_KEY_ID');
    const GREEN_INVOICE_API_KEY_SECRET = Deno.env.get('GREEN_INVOICE_API_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GREEN_INVOICE_API_KEY_ID || !GREEN_INVOICE_API_KEY_SECRET) {
      throw new Error('Green Invoice API credentials not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { leadId, sendEmail = true } = await req.json();

    if (!leadId) {
      throw new Error('leadId is required');
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    // Fetch truck types for name mapping
    const { data: truckTypes } = await supabase
      .from('truck_types')
      .select('id, name, name_he');

    // Fetch truck sizes for name and pricing
    const { data: truckSizes } = await supabase
      .from('truck_sizes')
      .select('id, name, dimensions, truck_type_id');

    // Fetch equipment for name mapping
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name, description');

    // Fetch all pricing
    const { data: pricing } = await supabase
      .from('pricing')
      .select('*')
      .eq('is_active', true);

    // Create pricing maps
    const pricingMap = new Map();
    pricing?.forEach((p: { item_type: string; item_id: string; sale_price: number }) => {
      pricingMap.set(`${p.item_type}:${p.item_id}`, p.sale_price);
    });

    const truckTypesMap = new Map();
    truckTypes?.forEach((t: { id: string; name_he: string }) => {
      truckTypesMap.set(t.id, t.name_he);
    });

    const truckSizesMap = new Map();
    truckSizes?.forEach((s: { id: string; name: string; dimensions: string; truck_type_id: string }) => {
      truckSizesMap.set(s.id, { name: s.name, dimensions: s.dimensions, truck_type_id: s.truck_type_id });
    });

    const equipmentMap = new Map();
    equipment?.forEach((e: { id: string; name: string }) => {
      equipmentMap.set(e.id, e.name);
    });

    // Build income items
    const incomeItems: IncomeItem[] = [];
    let totalBeforeVat = 0;

    // Add truck type as description line (price 0)
    if (lead.selected_truck_type) {
      // Try to find the Hebrew name for the truck type
      let truckTypeName = lead.selected_truck_type;
      truckTypes?.forEach((t: { id: string; name: string; name_he: string }) => {
        if (t.name === lead.selected_truck_type || t.name_he === lead.selected_truck_type) {
          truckTypeName = t.name_he;
        }
      });
      
      incomeItems.push({
        description: truckTypeName,
        quantity: 1,
        price: 0,
        vatType: 1,
      });
    }

    // Add truck size with price
    if (lead.selected_truck_size) {
      // Find the truck size ID from the name
      let sizeId: string | null = null;
      let sizeName = lead.selected_truck_size;
      
      truckSizes?.forEach((s: { id: string; name: string; dimensions: string }) => {
        if (s.name === lead.selected_truck_size) {
          sizeId = s.id;
          sizeName = `${s.name} - ${s.dimensions}`;
        }
      });

      const sizePrice = sizeId ? pricingMap.get(`truck_size:${sizeId}`) || 0 : 0;
      totalBeforeVat += sizePrice;

      incomeItems.push({
        description: sizeName,
        quantity: 1,
        price: sizePrice,
        vatType: 1,
      });
    }

    // Add selected equipment with prices
    if (lead.selected_equipment && Array.isArray(lead.selected_equipment)) {
      for (const equipId of lead.selected_equipment) {
        // Check if it's a UUID or a name
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(equipId);
        
        let equipName = equipId;
        let equipPrice = 0;

        if (isUUID) {
          equipName = equipmentMap.get(equipId) || equipId;
          equipPrice = pricingMap.get(`equipment:${equipId}`) || 0;
        } else {
          // Try to find the equipment by name
          equipment?.forEach((e: { id: string; name: string }) => {
            if (e.name === equipId) {
              equipName = e.name;
              equipPrice = pricingMap.get(`equipment:${e.id}`) || 0;
            }
          });
        }

        totalBeforeVat += equipPrice;

        incomeItems.push({
          description: equipName,
          quantity: 1,
          price: equipPrice,
          vatType: 1,
        });
      }
    }

    // Authenticate with Morning API
    console.log('Authenticating with Morning API...');
    const authResponse = await fetch(`${MORNING_API_URL}/account/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: GREEN_INVOICE_API_KEY_ID,
        secret: GREEN_INVOICE_API_KEY_SECRET,
      }),
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('Morning auth error:', authError);
      throw new Error(`Morning authentication failed: ${authError}`);
    }

    const authData = await authResponse.json();
    const token = authData.token;

    if (!token) {
      throw new Error('No token received from Morning API');
    }

    // Build client object
    const client: MorningClient = {
      name: lead.full_name,
      add: false,
    };

    if (lead.phone) {
      client.phone = lead.phone;
    }

    if (lead.email && sendEmail) {
      client.emails = [lead.email];
    }

    // Build document request
    const documentRequest: MorningDocumentRequest = {
      type: 10, // Price Quote
      lang: 'he',
      currency: 'ILS',
      vatType: 1, // Prices are before VAT
      client,
      income: incomeItems,
    };

    if (lead.notes) {
      documentRequest.remarks = lead.notes;
    }

    console.log('Creating price quote with Morning API...', JSON.stringify(documentRequest, null, 2));

    // Create the document
    const docResponse = await fetch(`${MORNING_API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(documentRequest),
    });

    if (!docResponse.ok) {
      const docError = await docResponse.text();
      console.error('Morning document creation error:', docError);
      throw new Error(`Failed to create price quote: ${docError}`);
    }

    const docData = await docResponse.json();
    console.log('Document created:', JSON.stringify(docData, null, 2));

    // Extract quote details
    const quoteId = docData.id;
    const quoteNumber = docData.number?.toString() || docData.id;
    const quoteUrl = docData.url?.origin || docData.url?.he || '';
    const quoteTotal = totalBeforeVat;

    // Update the lead with quote details
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        quote_id: quoteId,
        quote_number: quoteNumber,
        quote_sent_at: new Date().toISOString(),
        quote_total: quoteTotal,
        quote_url: quoteUrl,
        status: 'quoted',
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      // Don't throw - quote was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        quote_id: quoteId,
        quote_number: quoteNumber,
        quote_url: quoteUrl,
        quote_total: quoteTotal,
        total_with_vat: quoteTotal * 1.17,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating price quote:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
