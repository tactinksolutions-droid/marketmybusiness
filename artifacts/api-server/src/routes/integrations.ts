import { Router } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";
import {
  sendCampaign,
  handleDeliveryWebhook,
  listApprovedTemplates,
  sendWhatsAppTemplate,
  sendEmovurTemplate,
  EMOVUR_TEMPLATE_URL_PREFIX,
} from "../services/whatsappService";
import { sendEmailCampaign } from "../services/emailService";

const router = Router();

const KEY_FIELD_MAP: Record<string, { key: string; connected: string }> = {
  whatsapp: { key: "gupshup_api_key", connected: "whatsapp_connected" },
  email: { key: "brevo_api_key", connected: "email_connected" },
  chatgpt: { key: "openai_api_key", connected: "chatgpt_connected" },
  gemini: { key: "gemini_api_key", connected: "gemini_connected" },
};

router.post("/connect", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { channel, credential } = req.body ?? {};
  const fields = KEY_FIELD_MAP[channel];
  if (!fields) {
    res.status(400).json({ error: "Unknown channel" });
    return;
  }
  if (typeof credential !== "string" || !credential.trim()) {
    res.status(400).json({ error: "Missing credential" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ [fields.key]: credential.trim(), [fields.connected]: true })
    .eq("id", req.tenant.id);

  if (error) {
    req.log.error({ err: error, channel }, "Failed to save channel credential");
    res.status(500).json({ error: `Could not connect ${channel}` });
    return;
  }

  res.json({ success: true, channel, connected: true });
});

// Save the non-secret Gupshup sending config (sender number, app name, app id).
// The API key is set separately via /connect.
router.post("/whatsapp/settings", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { sourceNumber, appName, appId } = req.body ?? {};
  const update: Record<string, string | null> = {};
  if (sourceNumber !== undefined)
    update.gupshup_source_number = String(sourceNumber).trim() || null;
  if (appName !== undefined) update.gupshup_app_name = String(appName).trim() || null;
  if (appId !== undefined) update.gupshup_app_id = String(appId).trim() || null;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  // Saving Gupshup details means this business sends via Gupshup — keep the
  // provider selection consistent (the switch back from Emovur).
  update.whatsapp_provider = "gupshup";

  const { error } = await supabaseAdmin
    .from("businesses")
    .update(update)
    .eq("id", req.tenant.id);

  if (error) {
    req.log.error({ err: error }, "Failed to save WhatsApp settings");
    res.status(500).json({ error: "Could not save WhatsApp settings" });
    return;
  }
  res.json({ success: true });
});

// List the business's APPROVED WhatsApp templates (by friendly name).
router.get("/whatsapp/templates", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  try {
    const templates = await listApprovedTemplates(req.tenant.id);
    res.json({ templates });
  } catch (err) {
    req.log.error({ err }, "Failed to list WhatsApp templates");
    res.status(502).json({
      error: err instanceof Error ? err.message : "Could not load templates",
    });
  }
});

// Send a single approved template message — used to test WhatsApp on the platform.
router.post("/whatsapp/test", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { destination, templateId, params } = req.body ?? {};
  if (typeof destination !== "string" || !destination.replace(/\D/g, "")) {
    res.status(400).json({ error: "A valid destination number is required" });
    return;
  }
  if (typeof templateId !== "string" || !templateId.trim()) {
    res.status(400).json({ error: "Pick a template to send" });
    return;
  }
  const cleanParams = Array.isArray(params) ? params.map((p) => String(p)) : [];

  try {
    const result = await sendWhatsAppTemplate(req.tenant.id, {
      destination,
      templateId: templateId.trim(),
      params: cleanParams,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    req.log.error({ err }, "WhatsApp test send failed");
    res.status(502).json({
      error: err instanceof Error ? err.message : "WhatsApp send failed",
    });
  }
});

// Save the Emovur per-template webhook URL. This URL is the auth credential,
// so it is stored server-side only and stripped from /business/me responses.
router.post("/whatsapp/emovur/settings", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { templateUrl } = req.body ?? {};
  if (typeof templateUrl !== "string" || !templateUrl.trim()) {
    res.status(400).json({ error: "Paste your Emovur template link" });
    return;
  }
  const trimmed = templateUrl.trim();
  if (!trimmed.startsWith(EMOVUR_TEMPLATE_URL_PREFIX)) {
    res.status(400).json({ error: "That doesn't look like an Emovur template link" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({
      emovur_template_url: trimmed,
      whatsapp_provider: "emovur",
      whatsapp_connected: true,
    })
    .eq("id", req.tenant.id);

  if (error) {
    req.log.error({ err: error }, "Failed to save Emovur settings");
    res.status(500).json({ error: "Could not save Emovur settings" });
    return;
  }
  res.json({ success: true });
});

// Send the connected Emovur template to one number — tests Emovur on the platform.
router.post("/whatsapp/emovur/test", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { destination } = req.body ?? {};
  if (typeof destination !== "string" || !destination.replace(/\D/g, "")) {
    res.status(400).json({ error: "A valid destination number is required" });
    return;
  }
  try {
    const result = await sendEmovurTemplate(req.tenant.id, destination);
    res.json({ success: true, ...result });
  } catch (err) {
    req.log.error({ err }, "Emovur test send failed");
    res.status(502).json({
      error: err instanceof Error ? err.message : "Emovur send failed",
    });
  }
});

async function markSimulated(campaignId: string, contactCount: number) {
  return supabaseAdmin
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      total_sent: contactCount,
      total_delivered: contactCount,
      total_read: Math.floor(contactCount * 0.68),
    })
    .eq("id", campaignId);
}

router.post("/campaigns/:id/send", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const bizId = req.tenant.id;

  const { data: campaign, error: campErr } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", req.params.id)
    .eq("business_id", bizId)
    .single();

  if (campErr || !campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  let query = supabaseAdmin.from("contacts").select("*").eq("business_id", bizId);
  if (campaign.segment && campaign.segment !== "all") {
    query = query.eq("segment", campaign.segment);
  }
  const { data: contacts } = await query;

  if (!contacts?.length) {
    res.status(400).json({ error: "No contacts in this segment yet" });
    return;
  }

  if (campaign.channel === "whatsapp") {
    const biz = req.tenant;
    if (!biz.whatsapp_connected || !biz.gupshup_api_key) {
      const { error } = await markSimulated(campaign.id, contacts.length);
      if (error) {
        req.log.error({ err: error, campaignId: campaign.id }, "Failed to mark campaign sent");
        res.status(500).json({ error: "Could not send campaign" });
        return;
      }
      res.json({
        success: true,
        mode: "simulated",
        message: `Campaign sent to ${contacts.length} contacts (simulated — add your WhatsApp API key in Integrations to send real messages).`,
        stats: { sent: contacts.length, delivered: contacts.length },
      });
      return;
    }

    try {
      const results = await sendCampaign(bizId, campaign.id, contacts, campaign.message_body);
      res.json({ success: true, mode: "live", ...results });
    } catch (err) {
      req.log.error({ err, campaignId: campaign.id }, "WhatsApp campaign send failed");
      res.status(502).json({ error: "WhatsApp send failed" });
    }
    return;
  }

  if (campaign.channel === "email") {
    const biz = req.tenant;
    if (!biz.email_connected || !biz.brevo_api_key) {
      const { error } = await markSimulated(campaign.id, contacts.length);
      if (error) {
        req.log.error({ err: error, campaignId: campaign.id }, "Failed to mark campaign sent");
        res.status(500).json({ error: "Could not send campaign" });
        return;
      }
      res.json({
        success: true,
        mode: "simulated",
        message: `Campaign sent to ${contacts.length} contacts (simulated — add your Brevo API key in Integrations to send real emails).`,
        stats: { sent: contacts.length, delivered: contacts.length },
      });
      return;
    }

    try {
      const results = await sendEmailCampaign(biz, campaign, contacts);
      res.json({ success: true, mode: "live", ...results });
    } catch (err) {
      req.log.error({ err, campaignId: campaign.id }, "Email campaign send failed");
      res.status(502).json({
        error: err instanceof Error ? err.message : "Email send failed",
      });
    }
    return;
  }

  // Instagram, Facebook, LinkedIn, etc. are not wired for live sending yet.
  const { error } = await markSimulated(campaign.id, contacts.length);
  if (error) {
    req.log.error({ err: error, campaignId: campaign.id }, "Failed to mark campaign sent");
    res.status(500).json({ error: "Could not send campaign" });
    return;
  }
  res.json({
    success: true,
    mode: "simulated",
    message: `Campaign sent to ${contacts.length} contacts on ${campaign.channel} (simulated — live publishing for this channel is coming soon).`,
    stats: { sent: contacts.length, delivered: contacts.length },
  });
});

// Public delivery webhook — Gupshup calls this with delivery receipts (no tenant auth).
router.post("/webhook/whatsapp", async (req, res) => {
  await handleDeliveryWebhook(req.body);
  res.json({ status: "ok" });
});

// ─── Meta (Instagram + Facebook) OAuth login ──────────────────────────────
// Real "Continue with Facebook" flow. Requires a Meta developer app:
//   FB_APP_ID and FB_APP_SECRET stored as secrets, plus the redirect URI
//   below registered in the Meta app's Facebook Login settings.
const META_GRAPH_VERSION = "v21.0";
const META_SCOPE = "public_profile,email,pages_show_list";

function appDomain(): string | null {
  return process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() || null;
}

function metaRedirectUri(): string | null {
  const domain = appDomain();
  return domain ? `https://${domain}/api/integrations/meta/callback` : null;
}

// SESSION_SECRET is required: it signs the OAuth `state` so a forged callback
// cannot link an attacker's Facebook account to another business (CSRF).
function metaConfigured(): boolean {
  return Boolean(
    process.env.FB_APP_ID &&
      process.env.FB_APP_SECRET &&
      process.env.SESSION_SECRET &&
      appDomain()
  );
}

function signState(businessId: string): string {
  const secret = process.env.SESSION_SECRET as string;
  const payload = Buffer.from(
    JSON.stringify({ bid: businessId, exp: Date.now() + 10 * 60 * 1000 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyState(state: string): string | null {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;
    const [payload, sig] = state.split(".");
    if (!payload || !sig) return null;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      bid?: string;
      exp?: number;
    };
    if (!data.bid || !data.exp || Date.now() > data.exp) return null;
    return data.bid;
  } catch {
    return null;
  }
}

// Begin login: returns the real Facebook authorize URL (or configured:false).
router.post("/meta/start", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  if (!metaConfigured()) {
    res.json({ configured: false });
    return;
  }
  const state = signState(req.tenant.id);
  const params = new URLSearchParams({
    client_id: process.env.FB_APP_ID as string,
    redirect_uri: metaRedirectUri() as string,
    state,
    scope: META_SCOPE,
    response_type: "code",
  });
  res.json({
    configured: true,
    url: `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`,
  });
});

// Facebook redirects the owner's browser here after they approve (no tenant auth).
router.get("/meta/callback", async (req: any, res) => {
  const domain = appDomain();
  const appHome = domain ? `https://${domain}/` : "/";
  const back = (q: string) => res.redirect(`${appHome}?${q}`);

  const { code, state, error: fbError } = req.query as Record<string, string | undefined>;
  if (fbError) {
    back("meta_error=denied");
    return;
  }
  if (!code || !state || !metaConfigured()) {
    back("meta_error=invalid");
    return;
  }
  const businessId = verifyState(state);
  if (!businessId) {
    back("meta_error=invalid");
    return;
  }

  try {
    const tokenParams = new URLSearchParams({
      client_id: process.env.FB_APP_ID as string,
      client_secret: process.env.FB_APP_SECRET as string,
      redirect_uri: metaRedirectUri() as string,
      code,
    });
    // POST body keeps the app secret out of URLs / intermediary logs.
    const tokenRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      }
    );
    if (!tokenRes.ok) {
      req.log.error({ status: tokenRes.status }, "Meta token exchange failed");
      back("meta_error=failed");
      return;
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      back("meta_error=failed");
      return;
    }

    const meRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
    );
    const me = meRes.ok ? ((await meRes.json()) as { id?: string }) : {};

    const { error } = await supabaseAdmin
      .from("businesses")
      .update({
        meta_access_token: accessToken,
        meta_user_id: me.id ?? null,
        instagram_connected: true,
        facebook_connected: true,
      })
      .eq("id", businessId);

    if (error) {
      req.log.error({ err: error }, "Failed to save Meta connection");
      back("meta_error=failed");
      return;
    }

    back("connected=facebook");
  } catch (err) {
    req.log.error({ err }, "Meta OAuth callback error");
    back("meta_error=failed");
  }
});

// Disconnect Instagram + Facebook and clear the stored Meta token.
router.post("/meta/disconnect", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({
      meta_access_token: null,
      meta_user_id: null,
      instagram_connected: false,
      facebook_connected: false,
    })
    .eq("id", req.tenant.id);
  if (error) {
    req.log.error({ err: error }, "Failed to disconnect Meta");
    res.status(500).json({ error: "Could not disconnect" });
    return;
  }
  res.json({ success: true });
});

export default router;
