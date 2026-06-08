import { useState } from "react";
import type { Business } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import SetupScreen from "../components/Setup/SetupScreen";
import ContactsView from "../components/views/ContactsView";
import CampaignsView from "../components/views/CampaignsView";
import ReviewsView from "../components/views/ReviewsView";
import AnalyticsView from "../components/views/AnalyticsView";
import SettingsView from "../components/views/SettingsView";

export type View =
  | "Chat"
  | "Contacts"
  | "Campaigns"
  | "Reviews"
  | "Analytics"
  | "Settings";

export default function ChatPage({
  business,
  refetchBusiness,
}: {
  business: Business | null;
  refetchBusiness: () => void;
}) {
  const [view, setView] = useState<View>("Chat");

  const noChannels =
    !!business &&
    !business.whatsapp_connected &&
    !business.gmb_connected &&
    !business.instagram_connected &&
    !business.facebook_connected;

  const [showSetup, setShowSetup] = useState(noChannels);

  if (showSetup) {
    return (
      <SetupScreen
        business={business}
        onComplete={() => {
          refetchBusiness();
          setShowSetup(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar business={business} active={view} onSelect={setView} />
      <main className="flex-1 flex flex-col min-w-0">
        {view === "Chat" ? (
          <>
            <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                🌿
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {business?.name || "MarketMyBusiness"}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  AI assistant ready
                </p>
              </div>
              <div className="ml-auto text-xs text-gray-400">Powered by MarketMyBusiness</div>
            </header>
            <div className="flex-1 overflow-hidden bg-white">
              <ChatWindow business={business} />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            {view === "Contacts" && <ContactsView />}
            {view === "Campaigns" && <CampaignsView />}
            {view === "Reviews" && <ReviewsView />}
            {view === "Analytics" && <AnalyticsView />}
            {view === "Settings" && (
              <SettingsView business={business} onConnected={refetchBusiness} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
