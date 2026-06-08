import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.get("/me", tenantMiddleware, async (req: any, res) => {
  res.json({ business: req.tenant });
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
  res.json({ business: data });
});

router.post("/connect/:platform", tenantMiddleware, async (req: any, res) => {
  const { platform } = req.params;
  const validPlatforms = ["whatsapp", "gmb", "instagram", "facebook"];
  if (!validPlatforms.includes(platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }
  const field = `${platform}_connected`;
  await supabaseAdmin
    .from("businesses")
    .update({ [field]: true })
    .eq("id", req.tenant.id);
  res.json({ success: true, platform, message: `${platform} connected successfully` });
});

export default router;
