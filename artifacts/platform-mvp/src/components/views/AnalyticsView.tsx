import { useEffect, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";

interface RecentCampaign {
  name: string;
  status: string;
  channel: string;
  campaign_type: string;
  created_at: string;
  total_sent: number;
  total_read: number;
}

interface Summary {
  contacts: number;
  campaigns: number;
  reviews: number;
  gmbPosts: number;
  recentCampaigns: RecentCampaign[];
}

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

const statusPill: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
};

export default function AnalyticsView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/analytics/summary")
      .then(({ data }) => setSummary(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const sentCampaigns =
    summary?.recentCampaigns?.filter((c) => c.total_sent > 0) ?? [];
  const avgOpenRate =
    sentCampaigns.length > 0
      ? Math.round(
          sentCampaigns.reduce(
            (sum, c) => sum + (c.total_read / c.total_sent) * 100,
            0,
          ) / sentCampaigns.length,
        )
      : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ViewHeader title="Analytics" subtitle="Last 30 days overview" />

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
                      {c.channel === "whatsapp" ? "💬" : "📣"}
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
