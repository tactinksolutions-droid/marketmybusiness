import { useEffect, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";
import type { Business } from "../../hooks/useAuth";

const channels = [
  { key: "whatsapp", label: "WhatsApp", icon: "💬" },
  { key: "gmb", label: "Google My Business", icon: "📍" },
  { key: "instagram", label: "Instagram", icon: "📸" },
] as const;

export default function SettingsView({
  business,
  onConnected,
}: {
  business: Business | null;
  onConnected: () => void;
}) {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    whatsapp: !!business?.whatsapp_connected,
    gmb: !!business?.gmb_connected,
    instagram: !!business?.instagram_connected,
  });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setConnected({
      whatsapp: !!business?.whatsapp_connected,
      gmb: !!business?.gmb_connected,
      instagram: !!business?.instagram_connected,
    });
  }, [
    business?.whatsapp_connected,
    business?.gmb_connected,
    business?.instagram_connected,
  ]);

  async function connect(platform: string) {
    setBusy(platform);
    try {
      await api.post(`/business/connect/${platform}`);
      setConnected((p) => ({ ...p, [platform]: true }));
      onConnected();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ViewHeader title="Settings" subtitle="Your business profile and channels" />

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Business profile
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-gray-400">Name</dt>
          <dd className="text-gray-900">{business?.name || "—"}</dd>
          <dt className="text-gray-400">Type</dt>
          <dd className="text-gray-900">{business?.type || "—"}</dd>
          <dt className="text-gray-400">City</dt>
          <dd className="text-gray-900">
            {business?.city || "—"}
            {business?.locality ? `, ${business.locality}` : ""}
          </dd>
          <dt className="text-gray-400">Language</dt>
          <dd className="text-gray-900">{business?.language || "English"}</dd>
          <dt className="text-gray-400">Plan</dt>
          <dd className="text-gray-900 capitalize">
            {business?.plan || "starter"}
          </dd>
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Channels</h2>
        <div className="space-y-2">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-lg">{ch.icon}</span>
              <span className="text-sm text-gray-700">{ch.label}</span>
              {connected[ch.key] ? (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Connected
                </span>
              ) : (
                <button
                  onClick={() => connect(ch.key)}
                  disabled={busy === ch.key}
                  className="ml-auto text-xs font-medium text-green-700 border border-green-200 rounded-lg px-3 py-1 hover:bg-green-50 disabled:opacity-50"
                >
                  {busy === ch.key ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
