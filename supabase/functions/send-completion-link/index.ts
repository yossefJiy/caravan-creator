import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase credentials not configured');
    if (!RESEND_API_KEY) throw new Error('Resend API key not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { leadId, overrideRetry } = await req.json();
    if (!leadId) throw new Error('leadId is required');

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) throw new Error(`Lead not found: ${leadError?.message}`);
    if (!lead.email) throw new Error('Lead has no email address');

    // Idempotency check
    const type = 'completion_link';
    const idempKey = `${type}:${leadId}`;

    if (!overrideRetry) {
      const { data: existingSent } = await supabase
        .from('email_logs')
        .select('id')
        .eq('idempotency_key', idempKey)
        .eq('status', 'sent')
        .maybeSingle();

      if (existingSent) {
        console.log(`Completion link already sent for lead ${leadId}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Completion link already sent (idempotent)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get attempt number
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('attempt')
      .like('idempotency_key', `${type}:${leadId}%`)
      .order('attempt', { ascending: false })
      .limit(1)
      .maybeSingle();

    const attempt = overrideRetry && existingLog ? existingLog.attempt + 1 : 1;
    const finalKey = overrideRetry && existingLog ? `${idempKey}:retry_${attempt}` : idempKey;

    // Get site URL
    const { data: siteContent } = await supabase
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'site_url')
      .single();

    const siteUrl = siteContent?.content_value || 'https://caravan-creator.lovable.app';
    const completionLink = `${siteUrl}?continue=${leadId}`;

    // Fetch email config
    const { data: emailConfig } = await supabase
      .from('email_config')
      .select('*');

    const configMap: Record<string, string> = {};
    emailConfig?.forEach((item: { config_key: string; config_value: string }) => {
      configMap[item.config_key] = item.config_value;
    });

    const companyName = configMap['company_name'] || 'אליה פודטראקים ונגררים';
    const fromEmail = configMap['from_email'] || 'foodtracks@converto.co.il';
    const fromName = configMap['from_name'] || 'אליה פודטראקים ונגררים';

    const subject = `${companyName} - השלימו את הבחירות שלכם`;

    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center; }
    .header h1 { color: #1a1a1a; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .message { font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 25px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a1a; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${companyName}</h1></div>
    <div class="content">
      <p class="message">
        שלום ${lead.full_name},<br><br>
        הבקשה שלכם לפוד טראק התקבלה!<br><br>
        לחצו על הכפתור למטה כדי להשלים את הבחירות שלכם:
      </p>
      <div class="button-container">
        <a href="${completionLink}" class="button">השלמת הבחירות</a>
      </div>
      <p class="message">אם יש לכם שאלות, אל תהססו לפנות אלינו.</p>
    </div>
    <div class="footer"><p>&copy; ${new Date().getFullYear()} ${companyName}. כל הזכויות שמורות.</p></div>
  </div>
</body>
</html>
    `;

    // Insert queued log
    const { data: logEntry, error: logError } = await supabase
      .from('email_logs')
      .insert({
        lead_id: leadId,
        type,
        to_email: lead.email,
        subject,
        status: 'queued',
        idempotency_key: finalKey,
        provider: 'resend',
        attempt,
        metadata: null,
      })
      .select('id')
      .single();

    if (logError) console.error('Failed to insert email log:', logError);

    // Send email via Resend
    console.log('Sending completion link email to:', lead.email);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [lead.email],
        subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error('Resend error:', resendError);
      if (logEntry) {
        await supabase.from('email_logs').update({
          status: 'failed',
          error_message: `HTTP ${resendResponse.status}: ${resendError.substring(0, 500)}`,
        }).eq('id', logEntry.id);
      }
      throw new Error(`Failed to send email: ${resendError}`);
    }

    const resendData = await resendResponse.json();
    console.log('Completion link email sent successfully:', resendData);

    // Update log as sent
    if (logEntry) {
      await supabase.from('email_logs').update({
        status: 'sent',
        provider_message_id: resendData.id || null,
      }).eq('id', logEntry.id);
    }

    // Update lead timestamps
    await supabase
      .from('leads')
      .update({
        status: lead.status === 'new' ? 'contacted' : lead.status,
        completion_link_sent_at: new Date().toISOString(),
        notes: lead.notes
          ? `${lead.notes}\n\n[${new Date().toLocaleString('he-IL')}] נשלח קישור להשלמה`
          : `[${new Date().toLocaleString('he-IL')}] נשלח קישור להשלמה`,
      })
      .eq('id', leadId);

    return new Response(
      JSON.stringify({ success: true, message: 'Completion link sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending completion link:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
