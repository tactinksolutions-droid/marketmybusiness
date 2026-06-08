import { useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";

interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  priority: string;
  available: boolean;
}

const channels: Channel[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "💬",
    description: "Send campaigns to your customers directly on WhatsApp",
    priority: "Most impactful — connect first",
    available: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Schedule posts, reels, and stories. Capture leads from ads.",
    priority: "High impact for visual brands",
    available: true,
  },
  {
    id: "gmb",
    name: "Google My Business",
    icon: "📍",
    description: "Post updates, respond to reviews, attract local customers",
    priority: "Critical for local discovery",
    available: true,
  },
  {
    id: "facebook",
    name: "Facebook Pages",
    icon: "👥",
    description: "Schedule posts and run lead generation ads",
    priority: "Good for community building",
    available: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    description: "Publish videos, manage channel, track performance",
    priority: "Coming soon",
    available: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Post content and generate B2B leads",
    priority: "Coming soon",
    available: false,
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: "🎯",
    description: "Create and manage search and display campaigns",
    priority: "Available on Growth plan",
    available: false,
  },
  {
    id: "google_search_console",
    name: "Search Console",
    icon: "🔍",
    description: "Monitor website search performance and keywords",
    priority: "Available on Growth plan",
    available: false,
  },
];

const digitalMedia = [
  { name: "Google Analytics", status: "Connect via URL", id: "google_analytics" },
  { name: "Google Search Console", status: "Growth plan", id: "gsc" },
  { name: "Google Ads", status: "Growth plan", id: "google_ads" },
  { name: "Meta Ads Manager", status: "Growth plan", id: "meta_ads" },
];

export default function SetupScreen({
  business,
  onComplete,
}: {
  business: Business | null;
  onComplete: () => void;
}) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({
    whatsapp: !!business?.whatsapp_connected,
    gmb: !!business?.gmb_connected,
    instagram: !!business?.instagram_connected,
    facebook: !!business?.facebook_connected,
  });
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(channelId: string) {
    if (connecting) return;
    setConnecting(channelId);
    setError(null);
    try {
      await api.post(`/business/connect/${channelId}`);
      setConnected((prev) => ({ ...prev, [channelId]: true }));
    } catch {
      setError(`Couldn't connect that channel. Please try again.`);
    } finally {
      setConnecting(null);
    }
  }

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const canProceed = connectedCount >= 1;

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
            Connect your marketing channels so your AI assistant can start
            working. You can add more channels anytime from settings.
          </p>
          {connectedCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {connectedCount} channel{connectedCount > 1 ? "s" : ""} connected
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center">
            {error}
          </div>
        )}

        {/* Channel grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {channels.map((ch) => {
            const isConnected = connected[ch.id];
            const isConnecting = connecting === ch.id;

            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border p-4 transition-all
                  ${isConnected ? "border-green-300 bg-green-50" : "border-gray-200"}
                  ${!ch.available ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ch.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {ch.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {ch.description}
                      </p>
                      <p
                        className={`text-xs mt-1.5 font-medium
                          ${
                            isConnected
                              ? "text-green-600"
                              : ch.available
                                ? "text-amber-600"
                                : "text-gray-400"
                          }`}
                      >
                        {isConnected ? "✓ Connected" : ch.priority}
                      </p>
                    </div>
                  </div>
                  {ch.available && !isConnected && (
                    <button
                      onClick={() => handleConnect(ch.id)}
                      disabled={isConnecting}
                      className="flex-shrink-0 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {isConnecting ? "..." : "Connect"}
                    </button>
                  )}
                  {isConnected && (
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Digital media section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            📊 Analytics &amp; Digital Media
          </p>
          <div className="grid grid-cols-2 gap-2">
            {digitalMedia.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50"
              >
                <span className="text-xs font-medium text-gray-700">
                  {item.name}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onComplete}
            disabled={!canProceed}
            className="bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {canProceed
              ? "Start using MarketMyBusiness →"
              : "Connect at least one channel to continue"}
          </button>
          <button
            onClick={onComplete}
            className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Skip for now — I'll connect channels later
          </button>
        </div>
      </div>
    </div>
  );
}
