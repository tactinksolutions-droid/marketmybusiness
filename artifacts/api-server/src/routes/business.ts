import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

const SENSITIVE_FIELDS = ["gupshup_api_key", "brevo_api_key", "openai_api_key", "gemini_api_key"];

function sanitizeBusiness<T extends Record<string, unknown> | null>(b: T): T {
  if (!b) return b;
  const copy = { ...b } as Record<string, unknown>;
  for (const f of SENSITIVE_FIELDS) delete copy[f];
  return copy as T;
}

router.get("/me", tenantMiddleware, async (req: any, res) => {
  res.json({ business: sanitizeBusiness(req.tenant) });
});

router.patch("/me", tenantMiddleware, async (req: any, res) => {
  const allowed = ["language", "brand_tone", "brand_color", "monthly_ad_budget", "website_url"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const { data } = await supabaseAdmin
    .from("businesses")
    .update(updates)
    .eq("id", req.tenant.id)
    .select()
    .single();
  res.json({ business: sanitizeBusiness(data) });
});

const validPlatforms = [
  "whatsapp",
  "email",
  "instagram",
  "facebook",
  "linkedin",
  "gmb",
  "google_analytics",
  "google_ads",
  "gsc",
  "merchant",
  "claude",
  "chatgpt",
  "gemini",
];

router.post("/connect/:platform", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { platform } = req.params;
  if (!validPlatforms.includes(platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }
  const field = `${platform}_connected`;
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ [field]: true })
    .eq("id", req.tenant.id);
  if (error) {
    req.log.error({ err: error, platform }, "Failed to connect platform");
    res.status(500).json({ error: `Could not connect ${platform}` });
    return;
  }
  res.json({ success: true, platform, message: `${platform} connected successfully` });
});

router.post("/disconnect/:platform", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.status(404).json({ error: "No business profile found" });
    return;
  }
  const { platform } = req.params;
  if (!validPlatforms.includes(platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }
  const field = `${platform}_connected`;
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ [field]: false })
    .eq("id", req.tenant.id);
  if (error) {
    req.log.error({ err: error, platform }, "Failed to disconnect platform");
    res.status(500).json({ error: `Could not disconnect ${platform}` });
    return;
  }
  res.json({ success: true, platform, connected: false });
});

router.get("/channels", tenantMiddleware, async (req: any, res) => {
  const b = req.tenant;
  res.json({
    channels: {
      whatsapp: { connected: !!b?.whatsapp_connected, label: "WhatsApp Business" },
      instagram: { connected: !!b?.instagram_connected, label: "Instagram" },
      gmb: { connected: !!b?.gmb_connected, label: "Google My Business" },
      facebook: { connected: !!b?.facebook_connected, label: "Facebook Pages" },
    },
  });
});

export default router;
