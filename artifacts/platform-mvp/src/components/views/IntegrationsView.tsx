import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";
import type { View } from "../../pages/ChatPage";

type AuthType =
  | "gupshup"
  | "brevo"
  | "api_key"
  | "meta_oauth"
  | "linkedin_oauth"
  | "google_oauth";

type BadgeColor = "emerald" | "blue" | "amber";

interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  badge: string;
  badgeColor: BadgeColor;
  authType: AuthType;
  capabilities: string[];
}

interface IntegrationGroup {
  category: string;
  items: IntegrationItem[];
}

const INTEGRATIONS: IntegrationGroup[] = [
  {
    category: "Messaging",
    items: [
      {
        id: "whatsapp",
        name: "WhatsApp Business",
        icon: "💬",
        desc: "Send campaigns, automate replies, collect reviews",
        badge: "REAL API",
        badgeColor: "emerald",
        authType: "gupshup",
        capabilities: ["Campaigns", "Automation", "Review requests", "Delivery tracking"],
      },
      {
        id: "email",
        name: "Email (Brevo)",
        icon: "📧",
        desc: "Newsletters, drip campaigns, transactional email",
        badge: "REAL API",
        badgeColor: "emerald",
        authType: "brevo",
        capabilities: ["Newsletters", "Drip sequences", "Open tracking", "Click tracking"],
      },
    ],
  },
  {
    category: "Social Media",
    items: [
      {
        id: "instagram",
        name: "Instagram",
        icon: "📸",
        desc: "Posts, reels, stories, lead ads",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "meta_oauth",
        capabilities: ["Feed posts", "Stories", "Reels", "Lead ads", "Analytics"],
      },
      {
        id: "facebook",
        name: "Facebook Pages",
        icon: "👥",
        desc: "Page posts, lead generation, community",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "meta_oauth",
        capabilities: ["Page posts", "Lead forms", "Boost posts", "Page analytics"],
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        icon: "💼",
        desc: "Company page posts, thought leadership, B2B leads",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "linkedin_oauth",
        capabilities: ["Company posts", "Article publishing", "Lead gen forms"],
      },
    ],
  },
  {
    category: "Google",
    items: [
      {
        id: "gmb",
        name: "Google My Business",
        icon: "📍",
        desc: "Posts, reviews, Q&A, local SEO",
        badge: "REAL API",
        badgeColor: "emerald",
        authType: "google_oauth",
        capabilities: ["Posts", "Review replies", "Q&A", "Photo uploads", "Insights"],
      },
      {
        id: "google_analytics",
        name: "Google Analytics",
        icon: "📊",
        desc: "Website traffic, conversions, audience insights",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "google_oauth",
        capabilities: ["Traffic reports", "Conversion tracking", "Audience insights"],
      },
      {
        id: "google_ads",
        name: "Google Ads",
        icon: "🎯",
        desc: "Search, display, Performance Max campaigns",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "google_oauth",
        capabilities: ["Campaign creation", "Budget management", "Keyword research", "ROAS tracking"],
      },
      {
        id: "gsc",
        name: "Search Console",
        icon: "🔍",
        desc: "Organic search performance, keyword rankings",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "google_oauth",
        capabilities: ["Search rankings", "Click-through rates", "Indexing status"],
      },
      {
        id: "merchant",
        name: "Merchant Center",
        icon: "🛒",
        desc: "Product listings, Shopping ads, inventory",
        badge: "OAuth",
        badgeColor: "blue",
        authType: "google_oauth",
        capabilities: ["Product feeds", "Shopping campaigns", "Price benchmarks"],
      },
    ],
  },
  {
    category: "AI Engines",
    items: [
      {
        id: "claude",
        name: "Claude (Anthropic)",
        icon: "🧠",
        desc: "Campaign writing, strategy, brand voice",
        badge: "ACTIVE",
        badgeColor: "emerald",
        authType: "api_key",
        capabilities: ["Campaign copywriting", "Strategy advice", "Brand tone enforcement", "Chat interface"],
      },
      {
        id: "chatgpt",
        name: "ChatGPT (OpenAI)",
        icon: "💡",
        desc: "Content ideation, SEO copy, product descriptions",
        badge: "API Key",
        badgeColor: "blue",
        authType: "api_key",
        capabilities: ["Content ideas", "SEO writing", "Product descriptions", "Ad copy"],
      },
      {
        id: "gemini",
        name: "Gemini (Google)",
        icon: "✨",
        desc: "Image generation, video creation, multimodal content",
        badge: "API Key",
        badgeColor: "blue",
        authType: "api_key",
        capabilities: ["Image generation", "Video scripts", "Visual content", "Multilingual"],
      },
    ],
  },
];

const ALL_ITEMS = INTEGRATIONS.flatMap((g) => g.items);
const TOTAL = ALL_ITEMS.length;

const BADGE_COLORS: Record<BadgeColor, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
};

type ConnectedMap = Record<string, boolean>;

function buildConnected(business: Business | null): ConnectedMap {
  const out: ConnectedMap = {};
  for (const item of ALL_ITEMS) {
    const value = (business as Record<string, unknown> | null)?.[`${item.id}_connected`];
    out[item.id] = item.id === "claude" ? value !== false : !!value;
  }
  return out;
}

function IntegrationCard({
  item,
  connected,
  connecting,
  onConnect,
  onDisconnect,
}: {
  item: IntegrationItem;
  connected: boolean;
  connecting: boolean;
  onConnect: (id: string, authType: AuthType) => void;
  onDisconnect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        connected ? "border-emerald-200 shadow-sm" : "border-gray-200"
      } ${expanded ? "shadow-md" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 flex-shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{item.name}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[item.badgeColor]}`}
              >
                {item.badge}
              </span>
              {connected && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? "▲" : "▼"}
            </button>
            <button
              onClick={() =>
                connected ? onDisconnect(item.id) : onConnect(item.id, item.authType)
              }
              disabled={connecting}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                connected
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              } disabled:opacity-50`}
            >
              {connecting ? "..." : connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
            <div className="flex flex-wrap gap-1.5">
              {item.capabilities.map((cap) => (
                <span
                  key={cap}
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    connected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AuthModalState {
  id: string;
  type: "gupshup" | "brevo" | "api_key";
}

function AuthModal({
  channel,
  submitting,
  onSubmit,
  onClose,
}: {
  channel: AuthModalState;
  submitting: boolean;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  const configs: Record<
    AuthModalState["type"],
    { title: string; label: string; placeholder: string; help: string; link: string }
  > = {
    gupshup: {
      title: "Connect WhatsApp via Gupshup",
      label: "Gupshup API Key",
      placeholder: "sk-xxxxxxxxxxxxxxxx",
      help: "Get your API key from app.gupshup.io → Settings → API Key",
      link: "https://app.gupshup.io",
    },
    brevo: {
      title: "Connect Email via Brevo",
      label: "Brevo API Key",
      placeholder: "xkeysib-xxxxxxxxxxxxxxxx",
      help: "Get your API key from app.brevo.com → Settings → API Keys",
      link: "https://app.brevo.com/settings/keys/api",
    },
    api_key: {
      title: `Connect ${
        channel.id === "chatgpt" ? "OpenAI" : channel.id === "gemini" ? "Google Gemini" : "API"
      }`,
      label: "API Key",
      placeholder: "sk-xxxxxxxxxxxxxxxx",
      help:
        channel.id === "chatgpt"
          ? "Get from platform.openai.com → API Keys"
          : "Get from aistudio.google.com → API Keys",
      link:
        channel.id === "chatgpt"
          ? "https://platform.openai.com/api-keys"
          : "https://aistudio.google.com/app/apikey",
    },
  };

  const config = configs[channel.type] ?? configs.api_key;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">{config.title}</h2>
        <p className="text-xs text-gray-500 mb-4">{config.help}</p>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{config.label}</label>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config.placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
        />
        <a
          href={config.link}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-emerald-600 hover:underline mb-3"
        >
          Get your API key →
        </a>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          This enables the channel in your account so the AI can plan for it. Live sending through
          this provider isn't wired up yet — your key is not stored.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(value)}
            disabled={!value.trim() || submitting}
            className="flex-1 bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Connecting..." : "Connect"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsView({
  business,
  onConnected,
  onNavigate,
}: {
  business: Business | null;
  onConnected: () => void;
  onNavigate: (view: View) => void;
}) {
  const [connected, setConnected] = useState<ConnectedMap>(() => buildConnected(business));
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<AuthModalState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnected(buildConnected(business));
  }, [business]);

  const totalConnected = Object.values(connected).filter(Boolean).length;
  const pct = Math.round((totalConnected / TOTAL) * 100);

  function nameFor(id: string) {
    return ALL_ITEMS.find((i) => i.id === id)?.name ?? id;
  }

  async function persistConnect(channelId: string) {
    setConnecting(channelId);
    setError(null);
    try {
      await api.post(`/business/connect/${channelId}`);
      setConnected((prev) => ({ ...prev, [channelId]: true }));
      onConnected();
    } catch {
      setError(`Couldn't connect ${nameFor(channelId)}. Please try again.`);
    } finally {
      setConnecting(null);
    }
  }

  function handleConnect(channelId: string, authType: AuthType) {
    setError(null);
    if (authType === "gupshup") {
      setShowAuthModal({ id: channelId, type: "gupshup" });
      return;
    }
    if (authType === "brevo") {
      setShowAuthModal({ id: channelId, type: "brevo" });
      return;
    }
    if (authType === "api_key") {
      setShowAuthModal({ id: channelId, type: "api_key" });
      return;
    }
    void persistConnect(channelId);
  }

  async function handleDisconnect(channelId: string) {
    setConnecting(channelId);
    setError(null);
    try {
      await api.post(`/business/disconnect/${channelId}`);
      setConnected((prev) => ({ ...prev, [channelId]: false }));
      onConnected();
    } catch {
      setError(`Couldn't disconnect ${nameFor(channelId)}. Please try again.`);
    } finally {
      setConnecting(null);
    }
  }

  async function handleAuthSubmit(channelId: string) {
    setShowAuthModal(null);
    await persistConnect(channelId);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700">
                {totalConnected} of {TOTAL} connected
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Connect your brand's channels. The AI will use all connected platforms to create,
            publish, and measure your marketing automatically.
          </p>

          <div className="mt-4 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              Connect more channels for better AI recommendations
            </span>
            <span className="text-xs text-emerald-600 font-medium">{pct}% complete</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {INTEGRATIONS.map((group) => (
          <div key={group.category} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.category}
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">
                {group.items.filter((i) => connected[i.id]).length}/{group.items.length} connected
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  connected={!!connected[item.id]}
                  connecting={connecting === item.id}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {totalConnected >= 5 ? "✓ Good integration coverage" : "Connect more channels"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalConnected >= 5
                ? "Your AI assistant can now manage marketing across all connected channels."
                : "Connect at least 5 channels for the AI to give cross-channel recommendations."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("Chat")}
            className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-800 transition-colors flex-shrink-0 ml-4"
          >
            Go to AI Chat →
          </button>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          channel={showAuthModal}
          submitting={connecting === showAuthModal.id}
          onSubmit={() => handleAuthSubmit(showAuthModal.id)}
          onClose={() => setShowAuthModal(null)}
        />
      )}
    </div>
  );
}
