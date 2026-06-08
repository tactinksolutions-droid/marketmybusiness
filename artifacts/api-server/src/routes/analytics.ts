import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.get("/summary", tenantMiddleware, async (req: any, res) => {
  const bizId = req.tenant.id;

  const [
    { count: contacts },
    { count: campaigns },
    { data: recentCampaigns },
    { count: reviews },
    { count: gmbPosts },
  ] = await Promise.all([
    supabaseAdmin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId),
    supabaseAdmin
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId),
    supabaseAdmin
      .from("campaigns")
      .select("name,status,channel,campaign_type,created_at,total_sent,total_read")
      .eq("business_id", bizId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId),
    supabaseAdmin
      .from("gmb_posts")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId),
  ]);

  res.json({
    contacts: contacts || 0,
    campaigns: campaigns || 0,
    reviews: reviews || 0,
    gmbPosts: gmbPosts || 0,
    recentCampaigns: recentCampaigns || [],
  });
});

export default router;
