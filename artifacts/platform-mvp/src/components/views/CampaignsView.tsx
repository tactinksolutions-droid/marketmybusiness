import { useEffect, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  message_body: string;
  segment: string;
  status: string;
  campaign_type: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  total_sent: number;
  total_delivered?: number;
  total_read?: number;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; text: string; icon: string }
> = {
  draft: { label: "Awaiting approval", text: "text-amber-600", icon: "⏳" },
  approved: { label: "Approved", text: "text-blue-600", icon: "✓" },
  sent: { label: "Sent", text: "text-green-600", icon: "📤" },
  scheduled: { label: "Scheduled", text: "text-purple-600", icon: "🕐" },
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "💬",
  email: "📧",
  sms: "📱",
  instagram: "📸",
  facebook: "👥",
  gmb: "📍",
};

const FILTERS = ["all", "draft", "sent", "scheduled"] as const;
type Filter = (typeof FILTERS)[number];

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function load() {
    return api
      .get("/campaigns")
      .then(({ data }) => {
        setCampaigns(data.campaigns || []);
        setError(false);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function send(id: string) {
    setBusy(id);
    setNotice(null);
    try {
      const { data } = await api.post(`/integrations/campaigns/${id}/send`);
      setNotice(
        data?.message ||
          (data?.mode === "live"
            ? `Sent live to ${data.sent} contact(s)${data.failed ? `, ${data.failed} failed` : ""}.`
            : "Campaign sent.")
      );
      await load();
    } catch (err: any) {
      setNotice(err?.response?.data?.error || "Couldn't send the campaign. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await api.delete(`/campaigns/${id}`);
      await load();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  const filtered =
    filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <ViewHeader
          title="Campaigns"
          subtitle={`${campaigns.length} total · ${draftCount} awaiting approval`}
        />
        {draftCount > 0 && (
          <span className="flex-shrink-0 bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
            {draftCount} need{draftCount === 1 ? "s" : ""} approval
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
              filter === f
                ? "bg-green-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All" : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start justify-between gap-3">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-green-600 hover:text-green-800 text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading campaigns...</p>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-600">Couldn't load campaigns.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again in a moment.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-3xl mb-3">📣</p>
          <p className="text-sm font-medium text-gray-700 mb-1">
            No campaigns yet
          </p>
          <p className="text-xs text-gray-400">
            Go to Chat and say "Send a WhatsApp to my customers about [your
            offer]"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
            const openRate =
              c.total_sent > 0
                ? Math.round(((c.total_read ?? 0) / c.total_sent) * 100)
                : null;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-4 ${
                  c.status === "draft"
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {CHANNEL_ICONS[c.channel] || "📣"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${status.text}`}>
                          {status.icon} {status.label}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400 capitalize">
                          {c.channel}
                        </span>
                        {c.campaign_type && (
                          <>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400 capitalize">
                              {c.campaign_type.replace(/_/g, " ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>

                {/* Message preview */}
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {c.message_body}
                  </p>
                </div>

                {/* Stats for sent campaigns */}
                {c.status === "sent" && c.total_sent > 0 && (
                  <div className="flex flex-wrap gap-4 mb-1">
                    <div>
                      <p className="text-xs text-gray-400">Sent</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.total_sent}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Delivered</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.total_delivered ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Read</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.total_read ?? 0}
                      </p>
                    </div>
                    {openRate !== null && (
                      <div>
                        <p className="text-xs text-gray-400">Open rate</p>
                        <p
                          className={`text-sm font-semibold ${
                            openRate >= 50 ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {openRate}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions for drafts */}
                {c.status === "draft" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => send(c.id)}
                      disabled={busy === c.id}
                      className="flex-1 bg-green-700 text-white text-xs font-medium py-2 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60"
                    >
                      {busy === c.id ? "Working..." : "Approve & Send"}
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      disabled={busy === c.id}
                      className="flex-1 border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                      Delete draft
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
