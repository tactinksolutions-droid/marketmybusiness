import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.get("/", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.json({ reviews: [] });
    return;
  }
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("business_id", req.tenant.id)
    .order("created_at", { ascending: false });
  res.json({ reviews: data || [] });
});

export default router;
