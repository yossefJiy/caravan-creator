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

interface TruckType {
  id: string;
  name: string;
  name_he: string;
}

interface TruckSize {
  id: string;
  name: string;
  dimensions: string;
  truck_type_id: string;
}

interface Equipment {
  id: string;
  name: string;
  description: string | null;
}

interface Pricing {
  item_type: string;
  item_id: string;
  sale_price: number;
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

    const { leadId, sendEmail = false } = await req.json();

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
    const pricingMap = new Map<string, number>();
    (pricing as Pricing[] || []).forEach((p) => {
      pricingMap.set(`${p.item_type}:${p.item_id}`, p.sale_price);
    });

    // Create truck types map
    const truckTypesMap = new Map<string, TruckType>();
    (truckTypes as TruckType[] || []).forEach((t) => {
      truckTypesMap.set(t.id, t);
      // Also map by name_he for reverse lookup
      truckTypesMap.set(t.name_he, t);
    });

    // Create equipment map
    const equipmentList = (equipment as Equipment[] || []);
    const equipmentMap = new Map<string, Equipment>();
    equipmentList.forEach((e) => {
      equipmentMap.set(e.id, e);
    });

    // Find the truck type for this lead
    let truckTypeName = lead.selected_truck_type || '';
    let truckTypeId: string | null = null;
    
    if (lead.selected_truck_type) {
      // Find by Hebrew name
      const truckType = truckTypesMap.get(lead.selected_truck_type);
      if (truckType) {
        truckTypeName = truckType.name_he;
        truckTypeId = truckType.id;
      } else {
        // Search in all truck types
        (truckTypes as TruckType[] || []).forEach((t) => {
          if (t.name === lead.selected_truck_type || t.name_he === lead.selected_truck_type) {
            truckTypeName = t.name_he;
            truckTypeId = t.id;
          }
        });
      }
    }

    // Calculate prices FIRST before building income items
    let sizePrice = 0;
    let sizeName = '';
    let sizeId: string | null = null;

    if (lead.selected_truck_size) {
      // Find the truck size that matches both the name AND the truck type
      const matchedSize = (truckSizes as TruckSize[] || []).find((s) => {
        const nameMatches = s.name === lead.selected_truck_size;
        const typeMatches = truckTypeId ? s.truck_type_id === truckTypeId : true;
        return nameMatches && typeMatches;
      });

      if (matchedSize) {
        sizeId = matchedSize.id;
        sizeName = `${matchedSize.name} - ${matchedSize.dimensions}`;
        sizePrice = pricingMap.get(`truck_size:${matchedSize.id}`) || 0;
      } else {
        // Fallback: just match by name
        (truckSizes as TruckSize[] || []).forEach((s) => {
          if (s.name === lead.selected_truck_size) {
            sizeId = s.id;
            sizeName = `${s.name} - ${s.dimensions}`;
            sizePrice = pricingMap.get(`truck_size:${s.id}`) || 0;
          }
        });
      }
    }

    // Calculate equipment total and build equipment details
    let equipmentTotal = 0;
    const equipmentDetails: { name: string; price: number }[] = [];

    if (lead.selected_equipment && Array.isArray(lead.selected_equipment)) {
      for (const equipId of lead.selected_equipment) {
        // Check if it's a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(equipId);
        
        let equipName = equipId;
        let equipPrice = 0;
        let foundEquipId: string | null = null;

        if (isUUID) {
          const eq = equipmentMap.get(equipId);
          if (eq) {
            // Build full name with description
            equipName = eq.description ? `${eq.name} (${eq.description})` : eq.name;
            foundEquipId = eq.id;
          }
          equipPrice = pricingMap.get(`equipment:${equipId}`) || 0;
        } else {
          // Try to find the equipment by matching name at the start
          // This handles cases like "ציפסר גז (28 ליטר)" matching "ציפסר גז"
          for (const eq of equipmentList) {
            if (equipId.startsWith(eq.name)) {
              foundEquipId = eq.id;
              equipName = equipId; // Keep the original name with description
              equipPrice = pricingMap.get(`equipment:${eq.id}`) || 0;
              break;
            }
          }
          
          // Fallback: exact match
          if (!foundEquipId) {
            for (const eq of equipmentList) {
              if (eq.name === equipId) {
                foundEquipId = eq.id;
                equipName = eq.description ? `${eq.name} (${eq.description})` : eq.name;
                equipPrice = pricingMap.get(`equipment:${eq.id}`) || 0;
                break;
              }
            }
          }
        }

        equipmentTotal += equipPrice;
        equipmentDetails.push({ name: equipName, price: equipPrice });
      }
    }

    // Calculate total BEFORE VAT
    const totalBeforeVat = sizePrice + equipmentTotal;

    // Build income items with NEW structure:
    // 1. Truck type with TOTAL price
    // 2. "פירוט החבילה:" header with price 0
    // 3. All details (size + equipment) with price 0
    const incomeItems: IncomeItem[] = [];

    // Line 1: Truck type with the TOTAL price
    incomeItems.push({
      description: truckTypeName || 'פוד טראק',
      quantity: 1,
      price: totalBeforeVat,
      vatType: 1,
    });

    // Line 2: Package details header
    incomeItems.push({
      description: 'פירוט החבילה:',
      quantity: 1,
      price: 0,
      vatType: 1,
    });

    // Line 3: Truck size (with price 0)
    if (sizeName) {
      incomeItems.push({
        description: sizeName,
        quantity: 1,
        price: 0,
        vatType: 1,
      });
    }

    // Lines 4+: Equipment items (with price 0)
    for (const detail of equipmentDetails) {
      incomeItems.push({
        description: detail.name,
        quantity: 1,
        price: 0,
        vatType: 1,
      });
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

    // Only add email if sendEmail is true
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
    // Different update based on whether we're sending the email or just creating
    const updateData: Record<string, unknown> = {
      quote_id: quoteId,
      quote_number: quoteNumber,
      quote_total: quoteTotal,
      quote_url: quoteUrl,
      quote_created_at: new Date().toISOString(),
    };

    // Only update status and quote_sent_at if we're sending the email
    if (sendEmail) {
      updateData.quote_sent_at = new Date().toISOString();
      updateData.status = 'quoted';
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
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
        email_sent: sendEmail,
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
