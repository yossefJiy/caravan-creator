import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadNotificationRequest {
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  selectedTruckType?: string;
  selectedTruckSize?: string;
  selectedEquipment?: string[];
  overrideRetry?: boolean;
  isPartial?: boolean;
}

interface EmailLogEntry {
  lead_id: string;
  type: string;
  to_email: string;
  subject: string;
  status: string;
  idempotency_key: string;
  provider: string;
  attempt: number;
  metadata?: Record<string, unknown>;
  error_message?: string;
  provider_message_id?: string;
}

// Helper: check if email was already sent (idempotency)
async function checkIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string
): Promise<boolean> {
  const { data } = await supabase
    .from("email_logs")
    .select("id, status")
    .eq("idempotency_key", key)
    .eq("status", "sent")
    .maybeSingle();
  return !!data;
}

// Helper: insert a queued log entry
async function insertQueuedLog(
  supabase: ReturnType<typeof createClient>,
  entry: EmailLogEntry
): Promise<string | null> {
  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      lead_id: entry.lead_id,
      type: entry.type,
      to_email: entry.to_email,
      subject: entry.subject,
      status: "queued",
      idempotency_key: entry.idempotency_key,
      provider: "resend",
      attempt: entry.attempt,
      metadata: entry.metadata || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert email log:", error);
    return null;
  }
  return data.id;
}

// Helper: update log status
async function updateLogStatus(
  supabase: ReturnType<typeof createClient>,
  logId: string,
  status: "sent" | "failed",
  extra: { provider_message_id?: string; error_message?: string } = {}
) {
  await supabase
    .from("email_logs")
    .update({ status, ...extra })
    .eq("id", logId);
}

// Helper: send email via Resend and log result
async function sendAndLog(
  supabase: ReturnType<typeof createClient>,
  resendApiKey: string,
  logId: string,
  from: string,
  to: string[],
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const body = await response.text();

    if (response.ok) {
      let messageId: string | undefined;
      try {
        const parsed = JSON.parse(body);
        messageId = parsed.id;
      } catch { /* ignore */ }
      await updateLogStatus(supabase, logId, "sent", {
        provider_message_id: messageId,
      });
      return true;
    } else {
      console.error("Email send failed:", response.status, body);
      await updateLogStatus(supabase, logId, "failed", {
        error_message: `HTTP ${response.status}: ${body.substring(0, 500)}`,
      });
      return false;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send error:", msg);
    await updateLogStatus(supabase, logId, "failed", { error_message: msg });
    return false;
  }
}

// Helper: get attempt and final idempotency key
async function getAttemptInfo(
  supabase: ReturnType<typeof createClient>,
  idempKey: string,
  overrideRetry: boolean
): Promise<{ attempt: number; finalKey: string }> {
  const { data: existing } = await supabase
    .from("email_logs")
    .select("attempt")
    .eq("idempotency_key", idempKey)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  const attempt = overrideRetry && existing ? existing.attempt + 1 : 1;
  const finalKey = overrideRetry && existing ? `${idempKey}:retry_${attempt}` : idempKey;
  return { attempt, finalKey };
}

// Build partial email HTML for business
function buildPartialBusinessHtml(leadData: LeadNotificationRequest): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">ליד חדש (חלקי)</h1>
      <p style="color: #666; font-size: 14px;">הלקוח מילא פרטי קשר אך טרם השלים את בחירת הפודטראק.</p>
      <h2>פרטי הלקוח:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">שם מלא:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">טלפון:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td>
        </tr>
        ${leadData.email ? `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">אימייל:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${leadData.email}">${leadData.email}</a></td>
        </tr>` : ""}
      </table>
      ${leadData.notes ? `<h2>הערות:</h2><p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${leadData.notes}</p>` : ""}
      <p style="margin-top: 30px; color: #666; font-size: 12px;">ניתן לצפות בכל הלידים בממשק הניהול</p>
    </div>
  `;
}

// Build partial email HTML for client
function buildPartialClientHtml(leadData: LeadNotificationRequest, siteUrl: string): string {
  const continueUrl = `${siteUrl}?continue=${leadData.leadId}`;
  const firstName = leadData.fullName.split(" ")[0];
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D4AF37;">שלום ${firstName}!</h1>
      <p style="font-size: 16px; line-height: 1.6;">קיבלנו את הפרטים שלך, תודה!</p>
      <p style="font-size: 16px; line-height: 1.6;">שמנו לב שעדיין לא בחרת את סוג הפודטראק שלך. אנחנו מזמינים אותך להשלים את הבחירה כדי שנוכל להכין עבורך הצעת מחיר מותאמת אישית.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${continueUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">להשלמת הבחירה</a>
      </div>
      <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 10px; text-align: center;">
        <p style="color: white; font-size: 18px; margin: 0;">צוות אליה פודטראקים ונגררים</p>
        <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">נבנה לך את הפודטראק המושלם</p>
      </div>
    </div>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const leadData: LeadNotificationRequest = await req.json();
    const overrideRetry = leadData.overrideRetry === true;
    const isPartial = leadData.isPartial === true;

    // Fetch email config settings
    const { data: emailSettings, error: emailError } = await supabase
      .from("email_config")
      .select("config_key, config_value");
    if (emailError) throw new Error("Failed to fetch email settings");

    const { data: siteSettings } = await supabase
      .from("site_content")
      .select("content_key, content_value")
      .in("content_key", ["sender_name", "customer_sender_name", "customer_notification_emails", "site_url"]);

    const settingsMap: Record<string, string> = {};
    emailSettings?.forEach((s: { config_key: string; config_value: string }) => {
      settingsMap[s.config_key] = s.config_value;
    });
    siteSettings?.forEach((s: { content_key: string; content_value: string }) => {
      settingsMap[s.content_key] = s.content_value;
    });

    // Email sender config
    const senderEmail = settingsMap.sender_email || "noreply@storytell.co.il";
    const senderName = settingsMap.sender_name || "אליה קרוואנים";
    const customerSenderEmail = settingsMap.customer_sender_email || senderEmail;
    const customerSenderName = settingsMap.customer_sender_name || senderName;
    const siteUrl = settingsMap.site_url || "https://caravan-creator.lovable.app";

    // Recipient lists
    const notificationEmails = settingsMap.notification_emails
      ?.split(",").map((e: string) => e.trim()).filter((e: string) => e.length > 0) || [];
    const customerNotificationEmails = settingsMap.customer_notification_emails
      ?.split(",").map((e: string) => e.trim()).filter((e: string) => e.length > 0) || [];

    const results: { type: string; success: boolean }[] = [];
    const typeSuffix = isPartial ? "_partial" : "";

    if (isPartial) {
      // ========== PARTIAL LEAD EMAILS ==========
      const partialBusinessHtml = buildPartialBusinessHtml(leadData);
      const partialBusinessSubject = `ליד חדש (חלקי): ${leadData.fullName}`;

      // --- Business email #1 (partial) ---
      if (notificationEmails.length > 0) {
        const type = `lead_notification_business_1${typeSuffix}`;
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: notificationEmails.join(", "),
            subject: partialBusinessSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { is_partial: true },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${senderName} <${senderEmail}>`, notificationEmails, partialBusinessSubject, partialBusinessHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }

      // --- Business email #2 (partial) ---
      if (customerNotificationEmails.length > 0) {
        const type = `lead_notification_business_2${typeSuffix}`;
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: customerNotificationEmails.join(", "),
            subject: partialBusinessSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { is_partial: true },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${customerSenderName} <${customerSenderEmail}>`, customerNotificationEmails, partialBusinessSubject, partialBusinessHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }

      // --- Client partial email ---
      if (leadData.email && leadData.email.includes("@")) {
        const type = `lead_confirmation_client${typeSuffix}`;
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const clientSubject = "השלם את בחירת הפודטראק שלך - אליה פודטראקים ונגררים";
          const partialClientHtml = buildPartialClientHtml(leadData, siteUrl);
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: leadData.email, subject: clientSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { is_partial: true },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${customerSenderName} <${customerSenderEmail}>`, [leadData.email], clientSubject, partialClientHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }

    } else {
      // ========== COMPLETE LEAD EMAILS (existing logic) ==========

      // Check if quote exists for this lead
      const { data: leadRecord } = await supabase
        .from("leads")
        .select("quote_id, quote_url, quote_number, quote_total, quote_created_at")
        .eq("id", leadData.leadId)
        .single();

      const hasQuote = !!(leadRecord?.quote_id || leadRecord?.quote_created_at);

      // Build equipment list HTML
      const equipmentHtml = leadData.selectedEquipment?.length
        ? `<ul style="margin: 0; padding-right: 20px;">${leadData.selectedEquipment.map(
            (item) => `<li>${item}</li>`
          ).join("")}</ul>`
        : "<em>לא נבחר ציוד</em>";

      // Quote section for business emails
      const quoteHtml = hasQuote && leadRecord ? `
        <h2 style="color: #D4AF37;">הצעת מחיר מצורפת</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${leadRecord.quote_number ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">מספר הצעה:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadRecord.quote_number}</td>
          </tr>` : ""}
          ${leadRecord.quote_total ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">סכום:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">₪${Number(leadRecord.quote_total).toLocaleString()}</td>
          </tr>` : ""}
          ${leadRecord.quote_url ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">קישור:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${leadRecord.quote_url}">לצפייה בהצעת מחיר</a></td>
          </tr>` : ""}
        </table>
      ` : "";

      // Business email HTML
      const businessEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">ליד חדש!</h1>
          <h2>פרטי הלקוח:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">שם מלא:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">טלפון:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">אימייל:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${leadData.email}">${leadData.email}</a></td>
            </tr>
          </table>
          ${leadData.selectedTruckType ? `
          <h2>בחירות הקונפיגורטור:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckType}</td>
            </tr>
            ${leadData.selectedTruckSize ? `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckSize}</td>
            </tr>` : ""}
          </table>` : ""}
          <h2>ציוד שנבחר:</h2>
          ${equipmentHtml}
          ${leadData.notes ? `<h2>הערות:</h2><p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${leadData.notes}</p>` : ""}
          ${quoteHtml}
          <p style="margin-top: 30px; color: #666; font-size: 12px;">ניתן לצפות בכל הלידים בממשק הניהול</p>
        </div>
      `;

      // Client confirmation email (NO quote info)
      const customerEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D4AF37;">שלום ${leadData.fullName.split(" ")[0]}!</h1>
          <p style="font-size: 16px; line-height: 1.6;">תודה שפנית אלינו! קיבלנו את הבקשה שלך ונחזור אליך בהקדם.</p>
          <h2 style="color: #333; margin-top: 30px;">סיכום הבקשה שלך:</h2>
          ${leadData.selectedTruckType ? `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckType}</td>
            </tr>
            ${leadData.selectedTruckSize ? `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckSize}</td>
            </tr>` : ""}
          </table>` : ""}
          <h3>ציוד שנבחר:</h3>
          ${equipmentHtml}
          ${leadData.notes ? `<h3>הערות:</h3><p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${leadData.notes}</p>` : ""}
          <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 10px; text-align: center;">
            <p style="color: white; font-size: 18px; margin: 0;">צוות אליה פודטראקים ונגררים</p>
            <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">נבנה לך את הפודטראק המושלם</p>
          </div>
        </div>
      `;

      const businessSubject = hasQuote
        ? `ליד חדש: ${leadData.fullName} — הצעת מחיר מצורפת`
        : `ליד חדש: ${leadData.fullName}`;

      // --- Email 1: Business email #1 ---
      if (notificationEmails.length > 0) {
        const type = "lead_notification_business_1";
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: notificationEmails.join(", "),
            subject: businessSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { included_quote: hasQuote },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${senderName} <${senderEmail}>`, notificationEmails, businessSubject, businessEmailHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }

      // --- Email 2: Business email #2 ---
      if (customerNotificationEmails.length > 0) {
        const type = "lead_notification_business_2";
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: customerNotificationEmails.join(", "),
            subject: businessSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { included_quote: hasQuote },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${customerSenderName} <${customerSenderEmail}>`, customerNotificationEmails, businessSubject, businessEmailHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }

      // --- Email 3: Client confirmation ---
      if (leadData.email && leadData.email.includes("@")) {
        const type = "lead_confirmation_client";
        const idempKey = `${type}:${leadData.leadId}`;
        const alreadySent = !overrideRetry && await checkIdempotency(supabase, idempKey);

        if (alreadySent) {
          console.log(`Skipped ${type} (already sent)`);
          results.push({ type, success: true });
        } else {
          const { attempt, finalKey } = await getAttemptInfo(supabase, idempKey, overrideRetry);
          const clientSubject = "קיבלנו את הבקשה שלך - אליה פודטראקים ונגררים";
          const logId = await insertQueuedLog(supabase, {
            lead_id: leadData.leadId, type,
            to_email: leadData.email, subject: clientSubject, status: "queued",
            idempotency_key: finalKey, provider: "resend", attempt,
            metadata: { included_quote: false },
          });
          if (logId) {
            const ok = await sendAndLog(supabase, RESEND_API_KEY, logId,
              `${customerSenderName} <${customerSenderEmail}>`, [leadData.email], clientSubject, customerEmailHtml);
            results.push({ type, success: ok });
          } else {
            results.push({ type, success: false });
          }
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Lead ${leadData.leadId} (${isPartial ? "partial" : "complete"}): sent ${successCount}/${results.length} emails`, results);

    // Update lead timestamp
    await supabase
      .from("leads")
      .update({ lead_notification_sent_at: new Date().toISOString() })
      .eq("id", leadData.leadId);

    return new Response(
      JSON.stringify({ success: true, sentCount: successCount, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-lead-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
