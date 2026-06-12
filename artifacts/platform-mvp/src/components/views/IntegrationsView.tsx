import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";
import type { View } from "../../pages/ChatPage";

type Kind = "key" | "meta" | "soon";

interface Channel {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  kind: Kind;
  connectLabel: string;
  soonNote?: string;
}

interface KeyConfig {
  title: string;
  label: string;
  placeholder: string;
  help: string;
  link: string;
  note: string;
}

// What the owner sees — plain language, no jargon.
const CHANNELS: Channel[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    tagline: "Send messages and campaigns to your customers",
    kind: "key",
    connectLabel: "Connect WhatsApp",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    tagline: "Post photos, reels and stories",
    kind: "meta",
    connectLabel: "Continue with Facebook",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👥",
    tagline: "Post to your Facebook page",
    kind: "meta",
    connectLabel: "Continue with Facebook",
  },
  {
    id: "email",
    name: "Email",
    icon: "📧",
    tagline: "Send newsletters and offers by email",
    kind: "key",
    connectLabel: "Connect Email",
  },
  {
    id: "gmb",
    name: "Google My Business",
    icon: "📍",
    tagline: "Post updates and reply to reviews",
    kind: "soon",
    connectLabel: "Continue with Google",
    soonNote: "Google sign-in coming soon",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: "🎯",
    tagline: "Run ads on Google search",
    kind: "soon",
    connectLabel: "Continue with Google",
    soonNote: "Coming soon",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    tagline: "Publish videos for your business",
    kind: "soon",
    connectLabel: "Continue with Google",
    soonNote: "Coming soon",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    tagline: "Share updates on LinkedIn",
    kind: "soon",
    connectLabel: "Continue with LinkedIn",
    soonNote: "Coming soon",
  },
];

const KEY_CONFIGS: Record<string, KeyConfig> = {
  whatsapp: {
    title: "Connect WhatsApp",
    label: "WhatsApp sending key",
    placeholder: "Paste your key here",
    help: "From your WhatsApp provider (Gupshup) → Settings → API Key",
    link: "https://app.gupshup.io",
    note: "Saved securely to your account and used to send your WhatsApp campaigns. Never shown again.",
  },
  email: {
    title: "Connect Email",
    label: "Email sending key",
    placeholder: "Paste your key here",
    help: "From Brevo → Settings → API Keys",
    link: "https://app.brevo.com/settings/keys/api",
    note: "Saved securely to your account and used to send your email campaigns. Never shown again.",
  },
  chatgpt: {
    title: "Connect ChatGPT",
    label: "ChatGPT key",
    placeholder: "Paste your key here",
    help: "From platform.openai.com → API Keys",
    link: "https://platform.openai.com/api-keys",
    note: "Saved securely to your account to power extra content tools. Never shown again.",
  },
  gemini: {
    title: "Connect Gemini",
    label: "Gemini key",
    placeholder: "Paste your key here",
    help: "From aistudio.google.com → API Keys",
    link: "https://aistudio.google.com/app/apikey",
    note: "Saved securely to your account to power image and video tools. Never shown again.",
  },
};

interface AiEngine {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  included?: boolean;
}

const AI_ENGINES: AiEngine[] = [
  {
    id: "claude",
    name: "Claude",
    icon: "🧠",
    tagline: "Writes your campaigns, strategy and replies",
    included: true,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "💡",
    tagline: "Extra content ideas and ad copy",
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "✨",
    tagline: "Image and video content",
  },
];

type ConnectedMap = Record<string, boolean>;

function isConnected(business: Business | null, id: string): boolean {
  const value = (business as Record<string, unknown> | null)?.[`${id}_connected`];
  if (id === "claude") return value !== false;
  return !!value;
}

function buildConnected(business: Business | null): ConnectedMap {
  const out: ConnectedMap = {};
  for (const ch of CHANNELS) out[ch.id] = isConnected(business, ch.id);
  for (const e of AI_ENGINES) out[e.id] = isConnected(business, e.id);
  return out;
}

interface Notice {
  type: "success" | "info" | "error";
  msg: string;
}

const NOTICE_STYLES: Record<Notice["type"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  error: "border-red-200 bg-red-50 text-red-700",
};

function KeyModal({
  config,
  submitting,
  onSubmit,
  onClose,
}: {
  config: KeyConfig;
  submitting: boolean;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
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
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
        />
        <a
          href={config.link}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-emerald-600 hover:underline mb-3"
        >
          Where do I find this? →
        </a>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{config.note}</p>
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

function ChannelCard({
  channel,
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  channel: Channel;
  connected: boolean;
  busy: boolean;
  onConnect: (channel: Channel) => void;
  onDisconnect: (channel: Channel) => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 ${
        connected ? "border-emerald-200" : "border-gray-200"
      }`}
    >
      <span className="text-2xl flex-shrink-0">{channel.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{channel.tagline}</p>
      </div>

      {connected ? (
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Connected</span>
          </span>
          <button
            onClick={() => onDisconnect(channel)}
            disabled={busy}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            {busy ? "..." : "Remove"}
          </button>
        </div>
      ) : channel.kind === "soon" ? (
        <span className="flex-shrink-0 text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          {channel.soonNote ?? "Coming soon"}
        </span>
      ) : (
        <button
          onClick={() => onConnect(channel)}
          disabled={busy}
          className="flex-shrink-0 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {busy ? "..." : channel.connectLabel}
        </button>
      )}
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
  const [busy, setBusy] = useState<string | null>(null);
  const [keyModal, setKeyModal] = useState<{ id: string; config: KeyConfig } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    setConnected(buildConnected(business));
  }, [business]);

  // Handle the redirect back from Facebook login.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("connected");
    const err = params.get("meta_error");
    if (ok === "facebook") {
      setNotice({ type: "success", msg: "Facebook & Instagram connected." });
      onConnected();
    } else if (err) {
      setNotice({
        type: "error",
        msg:
          err === "denied"
            ? "Facebook login was cancelled. You can try again anytime."
            : "Couldn't finish connecting Facebook. Please try again.",
      });
    }
    if (ok || err) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedCount = CHANNELS.filter((c) => connected[c.id]).length;
  const pct = Math.round((connectedCount / CHANNELS.length) * 100);

  function startConnect(channel: Channel) {
    setNotice(null);
    if (channel.kind === "key") {
      const config = KEY_CONFIGS[channel.id];
      if (config) setKeyModal({ id: channel.id, config });
      return;
    }
    if (channel.kind === "meta") {
      void startMeta(channel.id);
    }
  }

  async function startMeta(channelId: string) {
    setBusy(channelId);
    setNotice(null);
    try {
      const { data } = await api.post("/integrations/meta/start");
      if (data?.configured && data?.url) {
        window.location.href = data.url;
        return;
      }
      setNotice({
        type: "info",
        msg: "Facebook sign-in is being set up — we'll enable it shortly.",
      });
    } catch {
      setNotice({ type: "error", msg: "Couldn't start Facebook login. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function submitKey(channelId: string, credential: string) {
    setKeyModal(null);
    setBusy(channelId);
    setNotice(null);
    try {
      await api.post("/integrations/connect", { channel: channelId, credential });
      setConnected((prev) => ({ ...prev, [channelId]: true }));
      onConnected();
    } catch {
      setNotice({ type: "error", msg: "Couldn't connect that account. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(channel: Channel) {
    setBusy(channel.id);
    setNotice(null);
    try {
      if (channel.kind === "meta") {
        await api.post("/integrations/meta/disconnect");
        setConnected((prev) => ({ ...prev, instagram: false, facebook: false }));
      } else {
        await api.post(`/business/disconnect/${channel.id}`);
        setConnected((prev) => ({ ...prev, [channel.id]: false }));
      }
      onConnected();
    } catch {
      setNotice({ type: "error", msg: "Couldn't remove that account. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function connectEngine(engine: AiEngine) {
    const config = KEY_CONFIGS[engine.id];
    if (config) setKeyModal({ id: engine.id, config });
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connect your accounts</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Link your social media and marketing accounts. The AI posts content and sends campaigns
            on your behalf.
          </p>

          {connectedCount > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-emerald-600 flex-shrink-0">
                {connectedCount} of {CHANNELS.length} connected
              </span>
            </div>
          )}
        </div>

        {notice && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${NOTICE_STYLES[notice.type]}`}>
            {notice.msg}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {CHANNELS.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              connected={!!connected[channel.id]}
              busy={busy === channel.id}
              onConnect={startConnect}
              onDisconnect={disconnect}
            />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            AI engines
          </h2>
          <div className="space-y-2">
            {AI_ENGINES.map((engine) => {
              const on = !!connected[engine.id];
              return (
                <div
                  key={engine.id}
                  className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4"
                >
                  <span className="text-2xl">{engine.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{engine.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{engine.tagline}</p>
                  </div>
                  {engine.included ? (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Included
                    </span>
                  ) : on ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-xs font-medium">Connected</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => connectEngine(engine)}
                      disabled={busy === engine.id}
                      className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {busy === engine.id ? "..." : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Claude is included in your plan. Add the others only if you have your own account.
          </p>
        </div>

        {connectedCount >= 1 ? (
          <button
            onClick={() => onNavigate("Chat")}
            className="w-full bg-emerald-700 text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            Start marketing with AI →
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-400">Connect at least one account to get started</p>
            <button
              onClick={() => onNavigate("Chat")}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      {keyModal && (
        <KeyModal
          config={keyModal.config}
          submitting={busy === keyModal.id}
          onSubmit={(val) => submitKey(keyModal.id, val)}
          onClose={() => setKeyModal(null)}
        />
      )}
    </div>
  );
}
