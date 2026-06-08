import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Business {
  id: string;
  name: string;
  type: string;
  city: string;
  locality?: string;
  language?: string;
  plan?: string;
  brand_tone?: string;
  website_url?: string;
  whatsapp_connected?: boolean;
  gmb_connected?: boolean;
  instagram_connected?: boolean;
}

interface Stats {
  contacts?: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ActionData {
  intent: string;
  channel?: string;
  segment?: string;
  contact_count?: number;
  message_draft?: string;
  post_text?: string;
  scheduled_time?: string | null;
  status?: string;
  campaign_name?: string;
  campaign_type?: string;
}

function buildSystemPrompt(business: Business, stats: Stats): string {
  const isZariyaa =
    business.name?.toLowerCase().includes("zariyaa") ||
    business.type?.toLowerCase().includes("wellness");

  const wellnessContext = isZariyaa
    ? `
SPECIAL CONTEXT — ZARIYAA ZEN GARDEN:
This is a wellness brand. Their products are Zen Garden installations — immersive mindfulness spaces for homes, offices, and institutions. Customers are:
- Wellness-conscious individuals (25-50 years, urban India, high disposable income)
- Corporates wanting to set up Zen spaces for employees
- Institutions (hospitals, schools, resorts)

The brand voice is: calm, warm, deeply caring, rooted in ancient wisdom meets modern science. Never pushy. Never salesy. Think of speaking the way a trusted wellness guide would — gentle but inspiring.

Zariyaa's strongest marketing asset is their corporate client list (Flipkart, Amazon, JP Morgan, HPCL, Deloitte, Samsung). Use this as social proof in B2C campaigns.

The purchase journey is considered — customers need to be nurtured over weeks, not days. WhatsApp nurture sequences work better than one-off blasts. Instagram visual content showing calm, beautiful Zen spaces drives aspirational desire.

Review collection from happy clients is their BIGGEST growth lever. Each positive Google review is worth hundreds of thousands in marketing value for a premium wellness brand.
`
    : "";

  return `You are the AI marketing assistant for ${business.name}, a ${business.type} in ${business.city}${business.locality ? ", " + business.locality : ""}, India.

You are a senior marketing consultant — warm, direct, brilliant. You think about what actually grows the business, not what sounds like marketing advice.
${wellnessContext}
BUSINESS:
- Name: ${business.name}
- Type: ${business.type}
- City: ${business.city}
- Language: ${business.language || "English"}
- Plan: ${business.plan}
- Contacts: ${stats?.contacts || 0}
- WhatsApp: ${business.whatsapp_connected ? "connected" : "not connected"}
- GMB: ${business.gmb_connected ? "connected" : "not connected"}
- Instagram: ${business.instagram_connected ? "connected" : "not connected"}
- Brand tone: ${business.brand_tone || "professional"}
- Website: ${business.website_url || "not set"}

HOW YOU SPEAK:
- Match their language. Hindi response for Hindi message. Hinglish is fine.
- 2-4 lines for most replies. Detailed only for strategy.
- Warm and direct. Never say "Great question!" or "I'd be happy to help" — just help.
- For wellness brands: always calm, inspiring, never pushy. Lead with the transformation, not the product.

WHAT YOU DO:
CREATE CAMPAIGN: Draft the message immediately. Suggest timing. Ask for approval once.
VIEW ANALYTICS: Lead with the one key number. Give a plain verdict. One next action.
GET SUGGESTION: ONE specific suggestion. Why now. Offer to execute.
CHANNEL NOT CONNECTED: Tell them. Offer to connect. Never fail silently.

For Zariyaa campaigns specifically:
- WhatsApp messages should feel like a personal note from a wellness guide, not a promotional blast
- Instagram captions should paint a picture of calm and transformation
- GMB posts should highlight the science and real stories behind Zen spaces
- Review requests should be sent 3-5 days after a customer interaction, not immediately

ACTION BLOCKS — when backend execution is needed, end your response with:
\`\`\`action
{
  "intent": "CREATE_CAMPAIGN",
  "channel": "whatsapp",
  "segment": "all",
  "contact_count": ${stats?.contacts || 0},
  "message_draft": "message here",
  "scheduled_time": null,
  "status": "awaiting_approval",
  "campaign_name": "Campaign Name",
  "campaign_type": "nurture"
}
\`\`\`

Valid intents: CREATE_CAMPAIGN | SCHEDULE_GMB_POST | TRIGGER_REVIEW_REQUEST | GENERATE_INSTAGRAM_CAPTION | CONNECT_CHANNEL | IMPORT_CONTACTS | GENERATE_REPORT

NEVER send a campaign without approval. NEVER ask more than one clarifying question. NEVER end with "Let me know if there's anything else".`;
}

function parseAction(raw: string): { display: string; action: ActionData | null } {
  const match = raw.match(/```action\n([\s\S]*?)\n```/);
  const display = raw.replace(/```action[\s\S]*?```/g, "").trim();
  let action: ActionData | null = null;
  if (match) {
    try {
      action = JSON.parse(match[1]);
    } catch {}
  }
  return { display, action };
}

export async function chat(
  business: Business,
  history: ChatMessage[],
  message: string,
  stats: Stats
): Promise<{ display: string; action: ActionData | null }> {
  const system = buildSystemPrompt(business, stats);
  const messages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system,
    messages,
  });
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  return parseAction(text);
}

export async function onboard(
  history: ChatMessage[],
  message: string
): Promise<{ complete: boolean; message?: string; data?: Record<string, string> }> {
  const system = `You are setting up a new GrowIQ account. Collect these 6 things through natural conversation, ONE question at a time:
1. Business name
2. Business type (be specific — "wellness brand", "salon", "restaurant" etc)
3. City and area (e.g. "Bengaluru, Indiranagar" — city is the city, area/locality is the neighbourhood)
4. Owner's first name
5. WhatsApp number
6. Preferred language (English/Hindi/Kannada/Tamil/Telugu)

The full conversation so far is provided in the messages below — read it carefully and track which of the 6 items the user has ALREADY answered. Never re-ask something already answered. Never jump back to question 1.

Rules:
- One question at a time. Warm and welcoming.
- The opening assistant message is already shown to the user, so do not repeat the greeting; just continue from where the conversation left off.

CONFIRMATION STEP — once you believe all 6 are collected, do NOT output JSON yet. First reply with a clear summary for the user to verify, exactly like this:

Perfect! Here's what I've got — please confirm it's all correct:

• Business: <name>
• Type: <type>
• Location: <area>, <city>
• Owner: <owner>
• WhatsApp: <phone>
• Language: <language>

Is everything correct? Reply "yes" to finish, or tell me what to change.

Only AFTER the user confirms the summary is correct, respond with ONLY this JSON (no other text):
{"done":true,"name":"...","type":"...","city":"...","locality":"...","owner":"...","phone":"...","language":"..."}

If the user asks to change something, update it, show the corrected summary again, and ask for confirmation once more.`;

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    system,
    messages: [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ],
  });
  const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  const jsonMatch = text.match(/\{[\s\S]*"done"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.done) return { complete: true, data: parsed };
    } catch {}
  }
  return { complete: false, message: text };
}
