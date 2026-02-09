import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DELAY_MINUTES_FIRST = 30;
const DELAY_MINUTES_SECOND = 24 * 60; // 24 hours

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find all incomplete leads older than 30 minutes
    const cutoffFirst = new Date(Date.now() - DELAY_MINUTES_FIRST * 60 * 1000).toISOString();

    const { data: partialLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, full_name, email, phone, notes, created_at")
      .eq("is_complete", false)
      .lt("created_at", cutoffFirst);

    if (leadsError) throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    if (!partialLeads || partialLeads.length === 0) {
      console.log("No partial leads found older than 30 minutes");
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${partialLeads.length} partial leads to check`);

    // Fetch all partial email logs for these leads (both first and reminder)
    const leadIds = partialLeads.map((l) => l.id);
    const { data: existingLogs } = await supabase
      .from("email_logs")
      .select("lead_id, type")
      .in("lead_id", leadIds)
      .in("type", ["lead_notification_business_1_partial", "lead_notification_business_1_partial_reminder"])
      .eq("status", "sent");

    // Build sets for tracking
    const firstSentIds = new Set<string>();
    const reminderSentIds = new Set<string>();
    (existingLogs || []).forEach((l) => {
      if (l.type === "lead_notification_business_1_partial") firstSentIds.add(l.lead_id!);
      if (l.type === "lead_notification_business_1_partial_reminder") reminderSentIds.add(l.lead_id!);
    });

    const cutoffSecond = new Date(Date.now() - DELAY_MINUTES_SECOND * 60 * 1000).toISOString();

    // Determine which leads need notifications
    const leadsToNotify: { lead: typeof partialLeads[0]; isReminder: boolean }[] = [];

    for (const lead of partialLeads) {
      if (!firstSentIds.has(lead.id)) {
        // First notification (30min) not sent yet
        leadsToNotify.push({ lead, isReminder: false });
      } else if (!reminderSentIds.has(lead.id) && lead.created_at < cutoffSecond) {
        // First was sent, reminder not sent, and 24h have passed
        leadsToNotify.push({ lead, isReminder: true });
      }
      // Otherwise: both sent already — skip (max 2)
    }

    if (leadsToNotify.length === 0) {
      console.log("All partial leads already notified (max 2 times)");
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending partial notifications for ${leadsToNotify.length} leads`);

    let successCount = 0;

    for (const { lead, isReminder } of leadsToNotify) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-lead-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            leadId: lead.id,
            fullName: lead.full_name,
            email: lead.email || "",
            phone: lead.phone,
            notes: lead.notes || "",
            isPartial: true,
            isReminder,
          }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          successCount++;
          console.log(`Partial ${isReminder ? 'reminder' : 'first'} notification sent for lead ${lead.id}`);
        } else {
          console.error(`Failed to send partial notification for lead ${lead.id}:`, result);
        }
      } catch (err) {
        console.error(`Error processing lead ${lead.id}:`, err);
      }
    }

    console.log(`Processed ${successCount}/${leadsToNotify.length} partial leads`);

    return new Response(
      JSON.stringify({ success: true, processed: successCount, total: leadsToNotify.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in check-partial-leads:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
