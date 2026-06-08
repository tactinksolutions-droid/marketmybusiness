import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.get("/", tenantMiddleware, async (req: any, res) => {
  const { data } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("business_id", req.tenant.id)
    .order("created_at", { ascending: false });

  const segments = (data || []).reduce(
    (acc: Record<string, number>, c: any) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    },
    {}
  );

  res.json({ contacts: data || [], total: data?.length || 0, segments });
});

router.post("/import", tenantMiddleware, async (req: any, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const tagged = contacts.map((c: any) => ({
    ...c,
    business_id: req.tenant.id,
    segment: c.last_contacted ? "warm" : "new",
    source: "import",
  }));

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .upsert(tagged, { onConflict: "business_id,phone", ignoreDuplicates: true })
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ imported: data?.length || 0 });
});

export default router;
