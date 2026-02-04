import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = new Resend(RESEND_API_KEY);

    const { leadId } = await req.json();

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

    if (!lead.quote_id || !lead.quote_url) {
      throw new Error('No quote exists for this lead. Please create a quote first.');
    }

    if (!lead.email) {
      throw new Error('Lead has no email address');
    }

    // Fetch email config for sender info
    const { data: emailConfig } = await supabase
      .from('email_config')
      .select('config_key, config_value');

    const configMap = new Map<string, string>();
    (emailConfig || []).forEach((c: { config_key: string; config_value: string }) => {
      configMap.set(c.config_key, c.config_value);
    });

    const fromEmail = configMap.get('from_email') || 'noreply@caravan-creator.com';
    const fromName = configMap.get('from_name') || 'אלויה ניגרים';
    const companyName = configMap.get('company_name') || 'אלויה ניגרים';

    // Format price for display
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

    const quoteTotal = lead.quote_total || 0;
    const quoteTotalWithVat = quoteTotal * 1.18;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [lead.email],
      subject: `הצעת מחיר מ${companyName} - מס׳ ${lead.quote_number}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              direction: rtl;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .quote-details {
              margin: 20px 0;
              padding: 15px;
              background: #fff;
              border-radius: 4px;
              border-right: 4px solid #d4a574;
            }
            .button {
              display: inline-block;
              background: #d4a574;
              color: #fff !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          
          <div class="content">
            <p>שלום ${lead.full_name},</p>
            
            <p>תודה על פנייתך אלינו!</p>
            
            <p>מצורפת הצעת המחיר שהכנו עבורך:</p>
            
            <div class="quote-details">
              <p><strong>מספר הצעה:</strong> ${lead.quote_number}</p>
              <p><strong>סכום לפני מע"מ:</strong> ${formatPrice(quoteTotal)}</p>
              <p><strong>סכום כולל מע"מ:</strong> ${formatPrice(quoteTotalWithVat)}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${lead.quote_url}" class="button">לצפייה בהצעת המחיר המלאה</a>
            </p>
            
            <p>לכל שאלה, אנחנו כאן לשירותך.</p>
            
            <p>בברכה,<br>${companyName}</p>
          </div>
          
          <div class="footer">
            <p>הודעה זו נשלחה אוטומטית ממערכת ${companyName}</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    // Update lead with sent timestamp and status
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        quote_sent_at: new Date().toISOString(),
        status: 'quoted',
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending quote to client:', error);
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
