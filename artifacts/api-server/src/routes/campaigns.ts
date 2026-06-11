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

router.delete("/:id", tenantMiddleware, async (req: any, res) => {
  await supabaseAdmin
    .from("campaigns")
    .delete()
    .eq("id", req.params.id)
    .eq("business_id", req.tenant.id);
  res.json({ success: true });
});

export default router;
