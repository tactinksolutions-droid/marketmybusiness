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
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-green-50 text-green-700",
  scheduled: "bg-blue-50 text-blue-700",
};

const channelIcons: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  gmb: "📍",
};

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/campaigns")
      .then(({ data }) => setCampaigns(data.campaigns || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ViewHeader
        title="Campaigns"
        subtitle="Messages drafted and sent through your channels"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading campaigns...</p>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-600">Couldn't load campaigns.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again in a moment.</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-3xl mb-2">📣</div>
          <p className="text-sm text-gray-500">No campaigns yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Ask the assistant in Chat to create a WhatsApp campaign.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {channelIcons[c.channel] || "📨"}
                </span>
                <p className="font-medium text-gray-900">{c.name}</p>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    statusColors[c.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                {c.message_body}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="capitalize">{c.channel}</span>
                <span>•</span>
                <span className="capitalize">{c.campaign_type?.replace(/_/g, " ")}</span>
                <span>•</span>
                <span className="capitalize">Segment: {c.segment}</span>
                {c.sent_at && (
                  <>
                    <span>•</span>
                    <span>Sent {new Date(c.sent_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
