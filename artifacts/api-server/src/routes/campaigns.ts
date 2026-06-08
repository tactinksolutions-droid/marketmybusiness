import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.get("/", tenantMiddleware, async (req: any, res) => {
  const { data } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("business_id", req.tenant.id)
    .order("created_at", { ascending: false });
  res.json({ campaigns: data || [] });
});

router.post("/:id/approve", tenantMiddleware, async (req: any, res) => {
  const { data: campaign } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", req.params.id)
    .eq("business_id", req.tenant.id)
    .single();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  await supabaseAdmin
    .from("campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", req.params.id);

  res.json({ success: true, message: `Campaign "${campaign.name}" approved and queued` });
});

router.delete("/:id", tenantMiddleware, async (req: any, res) => {
  await supabaseAdmin
    .from("campaigns")
    .delete()
    .eq("id", req.params.id)
    .eq("business_id", req.tenant.id);
  res.json({ success: true });
});

export default router;
