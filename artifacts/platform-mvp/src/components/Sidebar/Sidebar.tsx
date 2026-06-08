import { supabase } from "../../lib/supabase";
import type { Business } from "../../hooks/useAuth";
import type { View } from "../../pages/ChatPage";

const nav: { icon: string; label: View }[] = [
  { icon: "💬", label: "Chat" },
  { icon: "👥", label: "Contacts" },
  { icon: "📣", label: "Campaigns" },
  { icon: "⭐", label: "Reviews" },
  { icon: "📊", label: "Analytics" },
  { icon: "⚙️", label: "Settings" },
];

export default function Sidebar({
  business,
  active,
  onSelect,
}: {
  business: Business | null;
  active: View;
  onSelect: (v: View) => void;
}) {
  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-lg">
            🌿
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {business?.name || "My Business"}
            </p>
            <p className="text-xs text-gray-400 capitalize">{business?.plan || "starter"}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 px-2 mb-2 font-medium">Channels</p>
        {[
          { label: "WhatsApp", connected: business?.whatsapp_connected },
          { label: "Google My Business", connected: business?.gmb_connected },
          { label: "Instagram", connected: business?.instagram_connected },
        ].map((ch) => (
          <div key={ch.label} className="flex items-center gap-2 px-2 py-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                ch.connected ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-xs text-gray-500">{ch.label}</span>
          </div>
        ))}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.label)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              active === item.label
                ? "bg-green-50 text-green-800 font-medium"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="bg-green-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-medium text-green-800 mb-1">GrowIQ</p>
          <p className="text-xs text-green-600">AI marketing assistant</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
