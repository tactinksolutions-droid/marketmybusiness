import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";

interface RecentCampaign {
  name: string;
  status: string;
  channel: string;
  campaign_type: string;
  created_at: string;
  total_sent: number;
  total_read: number;
}

interface ChannelStat {
  sent: number;
  read: number;
  campaigns: number;
}

interface Summary {
  contacts: number;
  campaigns: number;
  reviews: number;
  gmbPosts: number;
  recentCampaigns: RecentCampaign[];
  channelStats?: Record<string, ChannelStat>;
}

const CHANNEL_METRICS = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    metrics: ["Messages sent", "Open rate", "Click rate"],
  },
  {
    id: "email",
    name: "Email",
    icon: "📧",
    metrics: ["Emails sent", "Open rate", "Unsubscribes"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    metrics: ["Reach", "Impressions", "Engagements"],
  },
  {
    id: "gmb",
    name: "Google My Business",
    icon: "📍",
    metrics: ["Views", "Calls", "Directions"],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: "🎯",
    metrics: ["Impressions", "Clicks", "ROAS"],
  },
] as const;

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p
        className={`text-2xl font-semibold ${
          highlight ? "text-green-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChannelCard({
  channel,
  data,
  connected,
}: {
  channel: (typeof CHANNEL_METRICS)[number];
  data: string[] | null;
  connected: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border p-4 ${
        connected ? "border-gray-200" : "border-dashed border-gray-200 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{channel.icon}</span>
          <span className="text-sm font-semibold text-gray-900">{channel.name}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {connected ? "Live" : "Not connected"}
        </span>
      </div>

      {connected && data ? (
        <div className="space-y-2">
          {channel.metrics.map((metric, i) => (
            <div key={metric} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{metric}</span>
              <span className="text-sm font-semibold text-gray-900">
                {data[i] || "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400">
            Connect this channel to see live metrics
          </p>
        </div>
      )}
    </div>
  );
}

const statusPill: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
};

function fetchSummary() {
  return api.get("/analytics/summary").then(({ data }) => data as Summary);
}

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnalyticsView({ business }: { business: Business | null }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary()
      .then((d) => {
        setSummary(d);
        setLastSync(nowTime());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  async function sync() {
    setSyncing(true);
    setSyncError(false);
    try {
      const d = await fetchSummary();
      setSummary(d);
      setError(false);
      setLastSync(nowTime());
    } catch {
      // Keep showing the previously loaded data instead of blanking the panel.
      setSyncError(true);
    } finally {
      setSyncing(false);
    }
  }

  const sentCampaigns =
    summary?.recentCampaigns?.filter((c) => c.total_sent > 0) ?? [];
  const avgOpenRate =
    sentCampaigns.length > 0
      ? Math.round(
          sentCampaigns.reduce(
            (sum, c) => sum + (c.total_read / c.total_sent) * 100,
            0
          ) / sentCampaigns.length
        )
      : 0;

  // Build channel rows from REAL per-channel delivery stats. Every value shown
  // matches its label; metrics we don't track yet stay as "—" (never faked).
  const cs = summary?.channelStats;
  function rate(stat?: ChannelStat): string {
    if (!stat || stat.sent <= 0) return "—";
    return `${Math.round((stat.read / stat.sent) * 100)}%`;
  }
  function count(stat?: ChannelStat): string {
    return stat ? `${stat.sent}` : "—";
  }

  // [Messages sent, Open rate, Click rate] etc. — order matches CHANNEL_METRICS.
  const channelData: Record<string, string[] | null> = {
    whatsapp: business?.whatsapp_connected
      ? [count(cs?.whatsapp), rate(cs?.whatsapp), "—"]
      : null,
    email: business?.email_connected
      ? [count(cs?.email), rate(cs?.email), "—"]
      : null,
    instagram: business?.instagram_connected ? ["—", "—", "—"] : null,
    gmb: business?.gmb_connected ? ["—", "—", "—"] : null,
    google_ads: business?.google_ads_connected ? ["—", "—", "—"] : null,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastSync ? `Last synced: ${lastSync}` : "Last 30 days overview"}
          </p>
        </div>
        <button
          onClick={sync}
          disabled={syncing || loading}
          className="text-xs text-green-600 hover:text-green-800 font-medium border border-green-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "↻ Sync now"}
        </button>
      </div>

      {syncError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-xs text-amber-700">
            Couldn't refresh just now — showing the last loaded data.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading analytics...</p>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-600">Couldn't load analytics.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again in a moment.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <MetricCard
              icon="👥"
              label="Total contacts"
              value={summary?.contacts ?? 0}
              sub="In your database"
            />
            <MetricCard
              icon="📣"
              label="Campaigns sent"
              value={summary?.campaigns ?? 0}
              sub="All time"
              highlight
            />
            <MetricCard
              icon="📖"
              label="Avg open rate"
              value={`${avgOpenRate}%`}
              sub="Platform avg: 58%"
              highlight={avgOpenRate >= 58}
            />
            <MetricCard
              icon="⭐"
              label="GMB posts"
              value={summary?.gmbPosts ?? 0}
              sub="Published"
            />
          </div>

          {/* Channel breakdown */}
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Channel performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {CHANNEL_METRICS.map((ch) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                data={channelData[ch.id]}
                connected={!!channelData[ch.id]}
              />
            ))}
          </div>

          {/* Recent campaigns */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Recent campaigns
            </h2>
            {!summary?.recentCampaigns?.length ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No campaigns yet — ask the AI to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {summary.recentCampaigns.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="flex items-center gap-3">
                    <span className="text-base">
                      {c.channel === "whatsapp"
                        ? "💬"
                        : c.channel === "email"
                          ? "📧"
                          : "📣"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        statusPill[c.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade nudge */}
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              🚀 Unlock full analytics
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Upgrade to Growth to see CAC, ROAS, Instagram reach, Google Ads
              performance, and one-click investor reports.
            </p>
            <button className="bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-green-800 transition-colors">
              Upgrade to Growth — ₹2,499/month
            </button>
          </div>
        </>
      )}
    </div>
  );
}
