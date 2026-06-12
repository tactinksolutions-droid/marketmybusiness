import { useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";
import type { Business } from "../../hooks/useAuth";
import type { View } from "../../pages/ChatPage";

interface Channel {
  id: string;
  name: string;
  icon: string;
  desc: string;
  tier: "starter" | "growth";
  connectable: boolean;
}

const socialChannels: Channel[] = [
  { id: "whatsapp", name: "WhatsApp Business", icon: "💬", desc: "Send campaigns and automated messages", tier: "starter", connectable: true },
  { id: "instagram", name: "Instagram", icon: "📸", desc: "Posts, reels, stories", tier: "starter", connectable: true },
  { id: "facebook", name: "Facebook Pages", icon: "👥", desc: "Page posts and lead generation", tier: "starter", connectable: true },
  { id: "email", name: "Email", icon: "📧", desc: "Newsletters and offers by email", tier: "starter", connectable: true },
  { id: "gmb", name: "Google My Business", icon: "📍", desc: "Local SEO, posts, review management", tier: "starter", connectable: false },
  { id: "youtube", name: "YouTube", icon: "▶️", desc: "Video publishing and analytics", tier: "growth", connectable: false },
  { id: "linkedin", name: "LinkedIn", icon: "💼", desc: "B2B content and lead generation", tier: "growth", connectable: false },
];

const digitalChannels: Channel[] = [
  { id: "google_ads", name: "Google Ads", icon: "🎯", desc: "Search and display campaign management", tier: "growth", connectable: false },
  { id: "gsc", name: "Google Search Console", icon: "🔍", desc: "Website search performance and keywords", tier: "growth", connectable: false },
  { id: "meta_ads", name: "Meta Ads Manager", icon: "📣", desc: "Facebook and Instagram paid campaigns", tier: "growth", connectable: false },
  { id: "google_analytics", name: "Google Analytics", icon: "📊", desc: "Website traffic and conversion tracking", tier: "growth", connectable: false },
];

const languages = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Gujarati", "Marathi"];
const tones = [
  "calm, warm, mindful",
  "friendly, casual",
  "professional, corporate",
  "fun, energetic",
  "luxury, premium",
];

function ChannelRow({
  channel,
  connected,
  plan,
}: {
  channel: Channel;
  connected: boolean;
  plan: string;
}) {
  const isLocked = channel.tier === "growth" && plan === "starter";

  return (
    <div
      className={`flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 ${
        isLocked ? "opacity-50" : ""
      }`}
    >
      <span className="text-2xl w-8 text-center">{channel.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{channel.name}</p>
          {isLocked && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Growth plan
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{channel.desc}</p>
      </div>
      <div className="flex-shrink-0">
        {connected ? (
          <span className="flex items-center gap-1.5 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-medium">Connected</span>
          </span>
        ) : channel.connectable ? (
          <span className="text-xs text-gray-400">Not connected</span>
        ) : (
          <span className="text-xs text-gray-400">Coming soon</span>
        )}
      </div>
    </div>
  );
}

export default function SettingsView({
  business,
  onConnected,
  onNavigate,
}: {
  business: Business | null;
  onConnected: () => void;
  onNavigate: (view: View) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = business?.plan || "starter";

  function isConnected(id: string): boolean {
    return !!(business as Record<string, unknown> | null)?.[`${id}_connected`];
  }

  async function saveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const language = (form.elements.namedItem("language") as HTMLSelectElement).value;
    const brand_tone = (form.elements.namedItem("brand_tone") as HTMLSelectElement).value;
    const website_url = (form.elements.namedItem("website_url") as HTMLInputElement).value;
    setSaving(true);
    setError(null);
    try {
      await api.patch("/business/me", { language, brand_tone, website_url });
      onConnected();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ViewHeader title="Settings" subtitle="Manage your business profile and channels" />

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Business details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Business details</h2>
        <form onSubmit={saveDetails} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Business name
            </label>
            <input
              defaultValue={business?.name || ""}
              disabled
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Language
              </label>
              <select
                name="language"
                defaultValue={business?.language || "English"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Brand tone
              </label>
              <select
                name="brand_tone"
                defaultValue={business?.brand_tone || "professional, corporate"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {tones.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Website URL
            </label>
            <input
              name="website_url"
              defaultValue={business?.website_url || ""}
              placeholder="https://yourwebsite.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Social channels */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Social media channels
          </h2>
          <button
            onClick={() => onNavigate("Integrations")}
            className="text-xs font-medium text-green-700 hover:text-green-800"
          >
            Manage connections →
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Connect accounts on the Integrations page to enable AI-powered campaign
          creation and scheduling
        </p>
        {socialChannels.map((ch) => (
          <ChannelRow
            key={ch.id}
            channel={ch}
            connected={isConnected(ch.id)}
            plan={plan}
          />
        ))}
      </div>

      {/* Digital media */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Digital media &amp; analytics
          </h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Ads management, search console, and deep analytics are on the way.
        </p>
        {digitalChannels.map((ch) => (
          <ChannelRow
            key={ch.id}
            channel={ch}
            connected={isConnected(ch.id)}
            plan={plan}
          />
        ))}
      </div>

      {/* Plan */}
      <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {plan} Plan
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {plan === "starter"
                ? "Upgrade to Growth to unlock Google Ads, Meta Ads, Analytics, and more."
                : "All features unlocked."}
            </p>
          </div>
          {plan === "starter" && (
            <button className="bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-green-800 transition-colors">
              Upgrade to Growth
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
