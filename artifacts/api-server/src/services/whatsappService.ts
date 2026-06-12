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

export interface GupshupConfig {
  apiKey: string | null;
  source: string | null;
  appName: string | null;
  appId: string | null;
}

async function getGupshupConfig(businessId: string): Promise<GupshupConfig> {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("gupshup_api_key, gupshup_source_number, gupshup_app_name, gupshup_app_id")
    .eq("id", businessId)
    .single();
  return {
    apiKey: data?.gupshup_api_key || process.env.GUPSHUP_API_KEY || null,
    source: data?.gupshup_source_number || process.env.GUPSHUP_SOURCE_NUMBER || null,
    appName: data?.gupshup_app_name || process.env.GUPSHUP_APP_NAME || null,
    appId: data?.gupshup_app_id || null,
  };
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
  templateType: string;
  paramCount: number;
}

function countParams(body: string): number {
  const matches = body.matchAll(/\{\{(\d+)\}\}/g);
  let max = 0;
  for (const m of matches) max = Math.max(max, Number(m[1]));
  return max;
}

// List APPROVED templates for the business's Gupshup app, resolving the
// friendly name (elementName, e.g. "whatsapp_test1") to its sending UUID.
export async function listApprovedTemplates(
  businessId: string
): Promise<WhatsAppTemplate[]> {
  const cfg = await getGupshupConfig(businessId);
  if (!cfg.apiKey) throw new Error("WhatsApp not connected — add your API key first");
  if (!cfg.appId) throw new Error("Add your Gupshup App ID to load templates");

  const response = await fetch(
    `https://api.gupshup.io/wa/app/${encodeURIComponent(cfg.appId)}/template`,
    { headers: { apikey: cfg.apiKey } }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gupshup error ${response.status}: ${text}`);
  }
  const json = (await response.json()) as {
    templates?: {
      id: string;
      elementName: string;
      data?: string;
      templateType?: string;
      status?: string;
    }[];
  };
  return (json.templates ?? [])
    .filter((t) => t.status === "APPROVED")
    .map((t) => ({
      id: t.id,
      name: t.elementName,
      body: t.data ?? "",
      templateType: t.templateType ?? "TEXT",
      paramCount: countParams(t.data ?? ""),
    }));
}

export interface TemplateSendInput {
  destination: string;
  templateId: string;
  params?: string[];
}

// Send an approved WhatsApp template via Gupshup's active /wa template endpoint.
export async function sendWhatsAppTemplate(
  businessId: string,
  input: TemplateSendInput
): Promise<{ status?: string; messageId?: string }> {
  const cfg = await getGupshupConfig(businessId);
  if (!cfg.apiKey) throw new Error("WhatsApp not connected — add your API key first");
  if (!cfg.source) throw new Error("Add your WhatsApp sender number first");
  if (!cfg.appName) throw new Error("Add your Gupshup app name first");

  const body = new URLSearchParams({
    channel: "whatsapp",
    source: cfg.source,
    destination: toIndianE164(input.destination),
    "src.name": cfg.appName,
    template: JSON.stringify({ id: input.templateId, params: input.params ?? [] }),
  });

  const response = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
    method: "POST",
    headers: {
      apikey: cfg.apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Gupshup error ${response.status}: ${text}`);
  }
  try {
    return JSON.parse(text) as { status?: string; messageId?: string };
  } catch {
    return { status: "submitted" };
  }
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
