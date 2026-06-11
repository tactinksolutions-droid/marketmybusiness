import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { tenantMiddleware } from "../middlewares/tenant";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_BRIEF = 2000;

const ALLOWED_CONTENT_TYPES = new Set([
  "whatsapp",
  "instagram_caption",
  "linkedin_post",
  "email_subject",
  "gmb_post",
  "facebook_post",
  "google_ad",
]);

const ALLOWED_CHANNELS = new Set([
  "whatsapp",
  "instagram",
  "linkedin",
  "email",
  "gmb",
  "facebook",
  "google_ads",
  "general",
]);

router.post("/generate", tenantMiddleware, async (req: any, res) => {
  const business = req.tenant;
  if (!business) {
    res.status(400).json({ error: "No business profile found" });
    return;
  }

  const { engine, brief, contentType, channel } = req.body || {};

  if (typeof engine !== "string" || !engine.trim()) {
    res.status(400).json({ error: "An AI engine is required" });
    return;
  }
  if (typeof brief !== "string" || !brief.trim()) {
    res.status(400).json({ error: "A brief is required" });
    return;
  }

  const engineId = engine.trim();
  const safeBrief = brief.slice(0, MAX_BRIEF);
  const rawType =
    typeof contentType === "string" && ALLOWED_CONTENT_TYPES.has(contentType)
      ? contentType
      : "post";
  const safeType = rawType.replace(/_/g, " ");
  const safeChannel =
    typeof channel === "string" && ALLOWED_CHANNELS.has(channel) ? channel : "general";

  const systemPrompt = `You are a marketing copywriter for ${business.name}, a ${business.type} in ${business.city}, India.
Brand tone: ${business.brand_tone || "professional, warm"}.
Website: ${business.website_url || ""}.
Write ONLY the content requested — no preamble, no explanation, no labels.`;

  const userPrompt = `Write a ${safeType} for ${safeChannel}.
Brief: ${safeBrief}
Write in the brand's tone. For Indian audience. Keep it authentic and non-generic.`;

  try {
    if (engineId === "claude") {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      res.json({ content: text, engine: "claude" });
      return;
    }

    if (engineId === "chatgpt") {
      const key = business.openai_api_key || process.env.OPENAI_API_KEY;
      if (!key) {
        res.status(400).json({ error: "OpenAI API key not configured" });
        return;
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 600,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        req.log.error({ status: response.status, detail }, "OpenAI generation failed");
        res.status(502).json({ error: "ChatGPT could not generate content" });
        return;
      }
      const data: any = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      res.json({ content: text, engine: "chatgpt" });
      return;
    }

    if (engineId === "gemini") {
      const key = business.gemini_api_key || process.env.GEMINI_API_KEY;
      if (!key) {
        res.status(400).json({ error: "Gemini API key not configured" });
        return;
      }
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
          }),
        }
      );
      if (!response.ok) {
        const detail = await response.text();
        req.log.error({ status: response.status, detail }, "Gemini generation failed");
        res.status(502).json({ error: "Gemini could not generate content" });
        return;
      }
      const data: any = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      res.json({ content: text, engine: "gemini" });
      return;
    }

    res.status(400).json({ error: "Unknown engine" });
  } catch (err) {
    req.log.error({ err, engine: engineId }, "Content generation error");
    res.status(500).json({ error: "Content generation failed" });
  }
});

export default router;
