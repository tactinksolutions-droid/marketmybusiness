import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

interface CampaignContact {
  phone?: string | null;
  name?: string | null;
}

export interface CampaignSendResult {
  sent: number;
  failed: number;
  errors: { phone: string; error: string }[];
}

async function getGupshupKey(businessId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("gupshup_api_key")
    .eq("id", businessId)
    .single();
  return data?.gupshup_api_key || process.env.GUPSHUP_API_KEY || null;
}

function toIndianE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") ? digits : `91${digits}`;
}

export async function sendWhatsAppMessage(
  businessId: string,
  phone: string,
  message: string,
  sourcePhone?: string
): Promise<unknown> {
  const apiKey = await getGupshupKey(businessId);
  if (!apiKey) throw new Error("WhatsApp not configured");

  const source = sourcePhone || process.env.GUPSHUP_SOURCE_NUMBER;
  if (!source) throw new Error("WhatsApp source number not configured");

  const body = new URLSearchParams({
    channel: "whatsapp",
    source,
    destination: toIndianE164(phone),
    message: JSON.stringify({ type: "text", text: message }),
    "src.name": process.env.GUPSHUP_APP_NAME || "MarketMyBusiness",
  });

  const response = await fetch("https://api.gupshup.io/sm/api/v1/msg", {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gupshup error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function sendCampaign(
  businessId: string,
  campaignId: string,
  contacts: CampaignContact[],
  messageBody: string
): Promise<CampaignSendResult> {
  const results: CampaignSendResult = { sent: 0, failed: 0, errors: [] };

  for (const contact of contacts) {
    if (!contact.phone) continue;
    try {
      const firstName = contact.name?.split(" ")[0] || "there";
      const personalised = messageBody.replace(/\[Name\]/gi, firstName);
      await sendWhatsAppMessage(businessId, contact.phone, personalised);
      results.sent++;
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      results.failed++;
      results.errors.push({
        phone: contact.phone,
        error: err instanceof Error ? err.message : "send failed",
      });
    }
  }

  const { error } = await supabaseAdmin
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      total_sent: results.sent,
      total_delivered: results.sent,
    })
    .eq("id", campaignId);

  if (error) {
    logger.error({ err: error, campaignId }, "Failed to update campaign stats after send");
  }

  return results;
}

export async function handleDeliveryWebhook(payload: unknown): Promise<void> {
  const p = payload as { messageId?: string; status?: string; destination?: string } | null;
  if (!p?.messageId) return;
  logger.info(
    { messageId: p.messageId, status: p.status, destination: p.destination },
    "WhatsApp delivery update"
  );
}
