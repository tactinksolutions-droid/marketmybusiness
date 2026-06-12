import type { Business } from "../../hooks/useAuth";

interface ChannelPreview {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: "ready" | "soon";
}

// Honest preview of what the owner can connect. The real connect actions
// (key entry / Continue with Facebook) live on the Integrations page — this
// screen only points them there, it never fakes a connection.
const channels: ChannelPreview[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "💬",
    description: "Send campaigns to your customers directly on WhatsApp",
    status: "ready",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Schedule posts, reels, and stories",
    status: "ready",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👥",
    description: "Post to your Facebook page",
    status: "ready",
  },
  {
    id: "email",
    name: "Email",
    icon: "📧",
    description: "Send newsletters and offers by email",
    status: "ready",
  },
  {
    id: "gmb",
    name: "Google My Business",
    icon: "📍",
    description: "Post updates and reply to reviews",
    status: "soon",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Share updates and generate B2B leads",
    status: "soon",
  },
];

function isConnected(business: Business | null, id: string): boolean {
  return !!(business as Record<string, unknown> | null)?.[`${id}_connected`];
}

export default function SetupScreen({
  business,
  onComplete,
}: {
  business: Business | null;
  onComplete: (goToIntegrations?: boolean) => void;
}) {
  const connectedCount = channels.filter((ch) => isConnected(business, ch.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome, {business?.name}
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Connect your marketing accounts so your AI assistant can post content
            and send campaigns for you. You can add more anytime from settings.
          </p>
          {connectedCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {connectedCount} account{connectedCount > 1 ? "s" : ""} connected
            </div>
          )}
        </div>

        {/* Channel preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {channels.map((ch) => {
            const connected = isConnected(business, ch.id);
            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border p-4 transition-all
                  ${connected ? "border-green-300 bg-green-50" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ch.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {ch.description}
                    </p>
                    <p
                      className={`text-xs mt-1.5 font-medium ${
                        connected
                          ? "text-green-600"
                          : ch.status === "ready"
                            ? "text-amber-600"
                            : "text-gray-400"
                      }`}
                    >
                      {connected
                        ? "✓ Connected"
                        : ch.status === "ready"
                          ? "Ready to connect"
                          : "Coming soon"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => onComplete(true)}
            className="bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-green-800 transition-colors"
          >
            Connect my accounts →
          </button>
          <button
            onClick={() => onComplete(false)}
            className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Skip for now — I'll connect accounts later
          </button>
        </div>
      </div>
    </div>
  );
}
