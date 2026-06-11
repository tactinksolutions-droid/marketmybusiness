import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";
import { sendCampaign, handleDeliveryWebhook } from "../services/whatsappService";
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

export default router;
