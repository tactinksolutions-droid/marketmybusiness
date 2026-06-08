import { Router } from "express";
import { chat, onboard } from "../services/claudeService";
import { supabaseAdmin } from "../lib/supabase";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();

router.post("/", tenantMiddleware, async (req: any, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: "Message required" });
    return;
  }

  try {
    if (!req.tenant?.onboarding_complete) {
      // During onboarding there is no business record yet, so no DB history exists.
      // Use the conversation history the client sends with every request instead.
      // Validate strictly: it is untrusted input that gets fed into the prompt.
      const rawHistory = Array.isArray(req.body.history) ? req.body.history : [];
      const clientHistory = rawHistory
        .filter(
          (m: any) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content.slice(0, 4000),
        }))
        .slice(-20);

      const result = await onboard(clientHistory, message);

      if (result.complete && result.data) {
        const d = result.data;
        const { data: biz, error } = await supabaseAdmin
          .from("businesses")
          .insert({
            owner_user_id: req.user.id,
            name: d.name,
            type: d.type,
            city: d.city,
            locality: d.locality,
            phone: d.phone,
            language: d.language,
            onboarding_complete: true,
            brand_tone: d.type?.toLowerCase().includes("wellness")
              ? "calm, warm, mindful, inspiring"
              : "friendly, professional",
          })
          .select()
          .single();

        if (error) throw error;

        res.json({
          message: `Welcome to MarketMyBusiness, ${d.owner}! 🌱 Your account for **${d.name}** is ready.\n\nHere's what I can do for you right now:\n• Send a WhatsApp campaign to your customers\n• Create Instagram content\n• Get more Google reviews\n• Post an update on Google My Business\n\nWhat would you like to start with?`,
          onboarding_complete: true,
          business: biz,
        });
        return;
      }

      res.json({ message: result.message });
      return;
    }

    const biz = req.tenant;
    const [{ data: history }, { count: contactCount }] = await Promise.all([
      supabaseAdmin
        .from("chat_messages")
        .select("role,content")
        .eq("business_id", biz.id)
        .order("created_at")
        .limit(20),
      supabaseAdmin
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id),
    ]);

    await supabaseAdmin
      .from("chat_messages")
      .insert({ business_id: biz.id, role: "user", content: message });

    const { display, action } = await chat(biz, history || [], message, {
      contacts: contactCount || 0,
    });

    await supabaseAdmin.from("chat_messages").insert({
      business_id: biz.id,
      role: "assistant",
      content: display,
      action_data: action,
    });

    let actionResult = null;
    if (action) {
      actionResult = await executeAction(action, biz);
    }

    res.json({ message: display, action, actionResult });
  } catch (err: any) {
    req.log.error({ err: err.message }, "Chat error");
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

async function executeAction(action: any, biz: any) {
  switch (action.intent) {
    case "CREATE_CAMPAIGN": {
      const { data: c } = await supabaseAdmin
        .from("campaigns")
        .insert({
          business_id: biz.id,
          name: action.campaign_name || "New Campaign",
          channel: action.channel || "whatsapp",
          message_body: action.message_draft,
          segment: action.segment || "all",
          status: "draft",
          campaign_type: action.campaign_type || "promotional",
          scheduled_at: action.scheduled_time || null,
        })
        .select()
        .single();
      return { campaign_id: c?.id, status: "draft_created" };
    }
    case "TRIGGER_REVIEW_REQUEST": {
      const { data: c } = await supabaseAdmin
        .from("campaigns")
        .insert({
          business_id: biz.id,
          name: "Google Review Request",
          channel: "whatsapp",
          message_body:
            action.message_draft ||
            `Hi! Thank you for choosing ${biz.name}. We'd love to hear about your experience. Could you share a quick Google review? It means the world to us 🙏`,
          status: "draft",
          campaign_type: "review_request",
        })
        .select()
        .single();
      return { campaign_id: c?.id, status: "draft_created" };
    }
    case "SCHEDULE_GMB_POST": {
      const { data: p } = await supabaseAdmin
        .from("gmb_posts")
        .insert({
          business_id: biz.id,
          post_text: action.post_text || action.message_draft,
          status: "draft",
        })
        .select()
        .single();
      return { post_id: p?.id, status: "gmb_post_draft_created" };
    }
    default:
      return { status: "acknowledged", intent: action.intent };
  }
}

router.get("/history", tenantMiddleware, async (req: any, res) => {
  if (!req.tenant) {
    res.json({ messages: [] });
    return;
  }
  const { data } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("business_id", req.tenant.id)
    .order("created_at")
    .limit(50);
  res.json({ messages: data || [] });
});

export default router;
