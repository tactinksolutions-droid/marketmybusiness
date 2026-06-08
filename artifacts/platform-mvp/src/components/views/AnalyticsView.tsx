import { useEffect, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";

interface Summary {
  contacts: number;
  campaigns: number;
  reviews: number;
  gmbPosts: number;
  recentCampaigns: {
    name: string;
    status: string;
    channel: string;
    campaign_type: string;
    created_at: string;
    total_sent: number;
    total_read: number;
  }[];
}

const stats = [
  { key: "contacts", label: "Contacts", icon: "👥" },
  { key: "campaigns", label: "Campaigns", icon: "📣" },
  { key: "reviews", label: "Reviews", icon: "⭐" },
  { key: "gmbPosts", label: "GMB Posts", icon: "📍" },
] as const;

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ViewHeader
        title="Analytics"
        subtitle="A snapshot of your marketing activity"
      />

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div
                key={s.key}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary?.[s.key] ?? 0}
                </p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Recent campaigns
          </h2>
          {summary?.recentCampaigns?.length ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentCampaigns.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {c.channel}
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {c.status}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.total_sent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">
                No campaigns yet — create one from Chat to see it here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
