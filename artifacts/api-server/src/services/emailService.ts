import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

interface EmailBusiness {
  id: string;
  name?: string | null;
  city?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
}

interface EmailCampaign {
  id: string;
  name: string;
  message_body: string;
}

interface EmailContact {
  email?: string | null;
  name?: string | null;
}

export interface EmailSendResult {
  sent: number;
  failed: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow http(s) URLs into email markup so a javascript:/data: scheme
// can't be embedded into a link or image. Returns null if unsafe/invalid.
function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function getBrevoKey(businessId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("brevo_api_key")
    .eq("id", businessId)
    .single();
  return data?.brevo_api_key || process.env.BREVO_API_KEY || null;
}

export async function sendEmailCampaign(
  business: EmailBusiness,
  campaign: EmailCampaign,
  contacts: EmailContact[]
): Promise<EmailSendResult> {
  const key = await getBrevoKey(business.id);
  if (!key) throw new Error("Email not configured");

  const emailContacts = contacts.filter((c) => c.email);
  if (!emailContacts.length) throw new Error("No contacts with email addresses");

  const results: EmailSendResult = { sent: 0, failed: 0 };
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "marketing@marketmybusiness.in";
  const senderName = business.name || "MarketMyBusiness";

  const bodyParagraphs = campaign.message_body
    .split("\n")
    .map(
      (line) =>
        `<p style="line-height:1.8;margin-bottom:16px;color:#4a5568;">${escapeHtml(line)}</p>`
    )
    .join("");

  const logoUrl = safeUrl(business.logo_url);
  const logoBlock = logoUrl
    ? `<div style="margin-bottom:32px;"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(business.name || "")}" style="height:40px;" /></div>`
    : "";

  const websiteUrl = safeUrl(business.website_url);
  const websiteLink = websiteUrl
    ? `<br/><a href="${escapeHtml(websiteUrl)}" style="color:#4A7C6F;">Visit our website</a>`
    : "";

  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #2d3748;">
      ${logoBlock}
      ${bodyParagraphs}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#a0aec0;">
          ${escapeHtml(business.name || "")}${business.city ? ` · ${escapeHtml(business.city)}` : ""}${websiteLink}
        </p>
      </div>
    </div>
  `;

  for (const contact of emailContacts) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: contact.email, name: contact.name || "" }],
          subject: campaign.name,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Brevo error ${response.status}: ${text}`);
      }
      results.sent++;
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      results.failed++;
      logger.warn(
        { err: err instanceof Error ? err.message : err, campaignId: campaign.id },
        "Email send failed for one contact"
      );
    }
  }

  const { error } = await supabaseAdmin
    .from("campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      total_sent: results.sent,
      total_delivered: results.sent,
    })
    .eq("id", campaign.id);

  if (error) {
    logger.error({ err: error, campaignId: campaign.id }, "Failed to update email campaign stats");
  }

  return results;
}
