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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const leadData: LeadNotificationRequest = await req.json();

    // Fetch email settings from site_content
    const { data: settings, error: settingsError } = await supabase
      .from("site_content")
      .select("content_key, content_value")
      .in("content_key", ["notification_emails", "sender_email", "sender_name"]);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error("Failed to fetch email settings");
    }

    const settingsMap = Object.fromEntries(
      (settings || []).map((s: { content_key: string; content_value: string }) => [s.content_key, s.content_value])
    );

    const notificationEmails = settingsMap.notification_emails
      ?.split(",")
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0) || [];
    
    const senderEmail = settingsMap.sender_email || "noreply@storytell.co.il";
    const senderName = settingsMap.sender_name || "אליה קרוואנים";

    // Build equipment list HTML
    const equipmentHtml = leadData.selectedEquipment?.length
      ? `<ul style="margin: 0; padding-right: 20px;">${leadData.selectedEquipment.map(
          (item) => `<li>${item}</li>`
        ).join("")}</ul>`
      : "<em>לא נבחר ציוד</em>";

    // Email to business
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
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <a href="tel:${leadData.phone}">${leadData.phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">אימייל:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <a href="mailto:${leadData.email}">${leadData.email}</a>
            </td>
          </tr>
        </table>

        ${leadData.selectedTruckType ? `
        <h2>בחירות הקונפיגורטור:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckType}</td>
          </tr>
          ${leadData.selectedTruckSize ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckSize}</td>
          </tr>
          ` : ""}
        </table>
        ` : ""}

        <h2>ציוד שנבחר:</h2>
        ${equipmentHtml}

        ${leadData.notes ? `
        <h2>הערות:</h2>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${leadData.notes}</p>
        ` : ""}

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          ניתן לצפות בכל הלידים בממשק הניהול
        </p>
      </div>
    `;

    // Email to customer
    const customerEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #D4AF37;">שלום ${leadData.fullName.split(" ")[0]}!</h1>
        
        <p style="font-size: 16px; line-height: 1.6;">
          תודה שפנית אלינו! קיבלנו את הבקשה שלך ונחזור אליך בהקדם.
        </p>

        <h2 style="color: #333; margin-top: 30px;">סיכום הבקשה שלך:</h2>
        
        ${leadData.selectedTruckType ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckType}</td>
          </tr>
          ${leadData.selectedTruckSize ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${leadData.selectedTruckSize}</td>
          </tr>
          ` : ""}
        </table>
        ` : ""}

        <h3>ציוד שנבחר:</h3>
        ${equipmentHtml}

        ${leadData.notes ? `
        <h3>הערות:</h3>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${leadData.notes}</p>
        ` : ""}

        <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 10px; text-align: center;">
          <p style="color: white; font-size: 18px; margin: 0;">צוות אליה קרוואנים</p>
          <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">נבנה לך את הפודטראק המושלם</p>
        </div>
      </div>
    `;

    const emailPromises: Promise<Response>[] = [];

    // Send to business emails using Resend API directly
    if (notificationEmails.length > 0) {
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: notificationEmails,
            subject: `ליד חדש: ${leadData.fullName}`,
            html: businessEmailHtml,
          }),
        })
      );
    }

    // Send confirmation to customer
    if (leadData.email && leadData.email.includes("@")) {
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [leadData.email],
            subject: "קיבלנו את הבקשה שלך - אליה קרוואנים",
            html: customerEmailHtml,
          }),
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    
    let successCount = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        const response = result.value;
        const body = await response.text();
        if (response.ok) {
          successCount++;
        } else {
          console.error("Email send failed:", response.status, body);
        }
      } else {
        console.error("Email promise rejected:", result.reason);
      }
    }

    console.log(`Sent ${successCount}/${emailPromises.length} emails for lead ${leadData.leadId}`);

    return new Response(
      JSON.stringify({ success: true, sentCount: successCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-lead-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
