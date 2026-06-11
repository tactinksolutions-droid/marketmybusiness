import { useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";
import type { View } from "../../pages/ChatPage";
import ViewHeader from "./ViewHeader";

const CONTENT_TYPES = [
  { id: "whatsapp", label: "WhatsApp message", icon: "💬", channel: "whatsapp" },
  { id: "instagram_caption", label: "Instagram caption", icon: "📸", channel: "instagram" },
  { id: "linkedin_post", label: "LinkedIn post", icon: "💼", channel: "linkedin" },
  { id: "email_subject", label: "Email subject + body", icon: "📧", channel: "email" },
  { id: "gmb_post", label: "Google My Business post", icon: "📍", channel: "gmb" },
  { id: "facebook_post", label: "Facebook post", icon: "👥", channel: "facebook" },
  { id: "google_ad", label: "Google Ad copy", icon: "🎯", channel: "google_ads" },
] as const;

interface Engine {
  id: "claude" | "chatgpt" | "gemini";
  name: string;
  company: string;
  icon: string;
  strength: string;
  connectedKey: keyof Business;
}

const AI_ENGINES: Engine[] = [
  {
    id: "claude",
    name: "Claude",
    company: "Anthropic",
    icon: "🧠",
    strength: "Brand voice, strategy, nuanced writing",
    connectedKey: "claude_connected",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    icon: "💡",
    strength: "Creative ideation, SEO copy, variations",
    connectedKey: "chatgpt_connected",
  },
  {
    id: "gemini",
    name: "Gemini",
    company: "Google",
    icon: "✨",
    strength: "Multilingual, image prompts, video scripts",
    connectedKey: "gemini_connected",
  },
];

export default function ContentView({
  business,
  onNavigate,
}: {
  business: Business | null;
  onNavigate: (v: View) => void;
}) {
  const [brief, setBrief] = useState("");
  const [contentType, setContentType] = useState<string>("whatsapp");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedEngines, setSelectedEngines] = useState<string[]>(["claude"]);
  const [notice, setNotice] = useState<string | null>(null);

  // Claude always works (server-side key). For ChatGPT/Gemini, a key is needed.
  function isConnected(engine: Engine): boolean {
    if (engine.id === "claude") return true;
    return !!business?.[engine.connectedKey];
  }

  function toggleEngine(id: string) {
    setSelectedEngines((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function generateContent() {
    if (!brief.trim() || selectedEngines.length === 0) return;
    const type = CONTENT_TYPES.find((t) => t.id === contentType);
    setResults({});

    await Promise.all(
      selectedEngines.map(async (engineId) => {
        setLoading((prev) => ({ ...prev, [engineId]: true }));
        try {
          const { data } = await api.post("/content/generate", {
            engine: engineId,
            brief,
            contentType,
            channel: type?.channel,
          });
          const content = typeof data.content === "string" ? data.content.trim() : "";
          setResults((prev) => ({
            ...prev,
            [engineId]: content || `${engineId} returned no content. Please try again.`,
          }));
        } catch (err: any) {
          setResults((prev) => ({
            ...prev,
            [engineId]:
              err?.response?.data?.error ||
              `Unable to generate with ${engineId}. ${
                engineId === "claude"
                  ? "Please try again."
                  : "Add the API key in Integrations."
              }`,
          }));
        } finally {
          setLoading((prev) => ({ ...prev, [engineId]: false }));
        }
      })
    );
  }

  async function copyDraft(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Couldn't copy — please select and copy manually.");
    }
  }

  async function useDraft(content: string, channel?: string) {
    setNotice(null);
    try {
      await api.post("/chat", {
        message: `Use this as the campaign message for ${channel || "my next campaign"}: "${content}"`,
      });
      setNotice("Draft sent to chat — opening AI Chat…");
      setTimeout(() => onNavigate("Chat"), 600);
    } catch {
      setNotice("Couldn't send the draft to chat. Please try again.");
    }
  }

  const activeEngines = AI_ENGINES.filter((e) => selectedEngines.includes(e.id));
  const anyVisible =
    Object.keys(results).length > 0 || Object.values(loading).some(Boolean);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ViewHeader
        title="AI Content Studio"
        subtitle="Generate marketing content for any channel using multiple AI engines side by side."
      />

      {notice && (
        <div className="mt-4 mb-1 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start justify-between gap-3">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-green-600 hover:text-green-800 text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-5 mb-5">
        {/* Content type selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Content type
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  contentType === type.id
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span>{type.icon}</span> {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brief input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Campaign brief
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder={`Describe what you want to communicate. Example: "Promote our new year membership offer. Calm, motivating tone. Offer a free trial class."`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* AI Engine selector */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Generate with
          </label>
          <div className="flex gap-2 flex-wrap">
            {AI_ENGINES.map((engine) => {
              const connected = isConnected(engine);
              const selected = selectedEngines.includes(engine.id);
              return (
                <button
                  key={engine.id}
                  onClick={() => toggleEngine(engine.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                    selected
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{engine.icon}</span>
                  <span className="font-medium">{engine.name}</span>
                  {!connected && !selected && (
                    <span className="text-xs text-gray-400">Key needed</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Claude works out of the box. ChatGPT and Gemini need their API keys
            added in Integrations.
          </p>
        </div>

        <button
          onClick={generateContent}
          disabled={!brief.trim() || selectedEngines.length === 0}
          className="w-full bg-green-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-40 transition-colors"
        >
          Generate content for {selectedEngines.length} AI engine
          {selectedEngines.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Results — side by side */}
      {anyVisible && (
        <div
          className={`grid gap-4 ${
            activeEngines.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {activeEngines.map((engine) => (
            <div
              key={engine.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-lg">{engine.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {engine.name}
                  </p>
                  <p className="text-xs text-gray-400">{engine.strength}</p>
                </div>
              </div>

              <div className="p-4">
                {loading[engine.id] ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </div>
                ) : results[engine.id] ? (
                  <>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                      {results[engine.id]}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyDraft(results[engine.id])}
                        className="flex-1 border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          useDraft(
                            results[engine.id],
                            CONTENT_TYPES.find((t) => t.id === contentType)?.channel
                          )
                        }
                        className="flex-1 bg-green-700 text-white text-xs font-medium py-2 rounded-lg hover:bg-green-800 transition-colors"
                      >
                        Use this draft
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 py-4">Waiting…</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
