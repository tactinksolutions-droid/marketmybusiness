import type { ActionData } from "../../hooks/useChat";

const channelLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
  instagram: "Instagram",
};
const typeLabel: Record<string, string> = {
  promotional: "Promotional",
  nurture: "Nurture sequence",
  review_request: "Review request",
  gmb_post: "GMB post",
};

export default function ActionCard({
  action,
  onApprove,
  onReject,
}: {
  action: ActionData;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isReview =
    action.campaign_type === "review_request" ||
    action.intent === "TRIGGER_REVIEW_REQUEST";

  return (
    <div
      className={`mx-auto max-w-[88%] border rounded-2xl overflow-hidden mb-4 ${
        isReview ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
      }`}
    >
      <div className={`px-4 py-2.5 flex items-center gap-2 ${isReview ? "bg-amber-700" : "bg-green-700"}`}>
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          {isReview ? "⭐ Review request ready" : "📣 Campaign ready for approval"}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-3 text-xs text-gray-500 mb-2">
          {action.channel && (
            <span>Channel: {channelLabel[action.channel] || action.channel}</span>
          )}
          {action.contact_count !== undefined && action.contact_count > 0 && (
            <span>· {action.contact_count} recipients</span>
          )}
          {action.campaign_type && (
            <span>· {typeLabel[action.campaign_type] || action.campaign_type}</span>
          )}
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 mb-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {action.message_draft}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className={`flex-1 text-white rounded-xl py-2 text-sm font-medium transition-colors ${
              isReview ? "bg-amber-700 hover:bg-amber-800" : "bg-green-700 hover:bg-green-800"
            }`}
          >
            Send it ✓
          </button>
          <button
            onClick={onReject}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Edit message
          </button>
        </div>
      </div>
    </div>
  );
}
