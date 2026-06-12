import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { Business } from "../../hooks/useAuth";

interface Template {
  id: string;
  name: string;
  body: string;
  templateType: string;
  paramCount: number;
}

interface Contact {
  id: string;
  name?: string | null;
  phone?: string | null;
}

interface Result {
  type: "success" | "error";
  msg: string;
}

function fillPreview(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_m, n) => params[Number(n) - 1] || `{{${n}}}`);
}

export default function WhatsAppTester({
  business,
  onSaved,
}: {
  business: Business;
  onSaved: () => void;
}) {
  const [sourceNumber, setSourceNumber] = useState(business.gupshup_source_number ?? "");
  const [appName, setAppName] = useState(business.gupshup_app_name ?? "");
  const [appId, setAppId] = useState(business.gupshup_app_id ?? "");
  const [savingSettings, setSavingSettings] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [destination, setDestination] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [params, setParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setSourceNumber(business.gupshup_source_number ?? "");
    setAppName(business.gupshup_app_name ?? "");
    setAppId(business.gupshup_app_id ?? "");
  }, [business]);

  useEffect(() => {
    api
      .get("/contacts")
      .then(({ data }) => setContacts(data.contacts || []))
      .catch(() => setContacts([]));
  }, []);

  const selected = templates.find((t) => t.id === templateId) || null;
  const settingsComplete =
    !!sourceNumber.trim() && !!appName.trim() && !!appId.trim();

  async function saveSettings() {
    setSavingSettings(true);
    setResult(null);
    try {
      await api.post("/integrations/whatsapp/settings", {
        sourceNumber,
        appName,
        appId,
      });
      onSaved();
      setResult({ type: "success", msg: "WhatsApp sending details saved." });
    } catch {
      setResult({ type: "error", msg: "Couldn't save those details. Please try again." });
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadTemplates() {
    setLoadingTemplates(true);
    setResult(null);
    try {
      const { data } = await api.get("/integrations/whatsapp/templates");
      const list: Template[] = data.templates || [];
      setTemplates(list);
      if (list.length === 0) {
        setResult({ type: "error", msg: "No approved templates found on your Gupshup app yet." });
      } else {
        const preferred = list.find((t) => t.name === "whatsapp_test1") || list[0];
        selectTemplate(preferred);
      }
    } catch (err: any) {
      setResult({
        type: "error",
        msg: err?.response?.data?.error || "Couldn't load your templates. Check your App ID and API key.",
      });
    } finally {
      setLoadingTemplates(false);
    }
  }

  function selectTemplate(t: Template) {
    setTemplateId(t.id);
    setParams(Array.from({ length: t.paramCount }, () => ""));
  }

  async function sendTest() {
    if (!destination.trim() || !templateId) return;
    setSending(true);
    setResult(null);
    try {
      const { data } = await api.post("/integrations/whatsapp/test", {
        destination,
        templateId,
        params,
      });
      setResult({
        type: "success",
        msg: `Sent to ${destination} — Gupshup accepted it${
          data.messageId ? ` (id ${data.messageId})` : ""
        }. Check the phone for the message.`,
      });
    } catch (err: any) {
      setResult({
        type: "error",
        msg: err?.response?.data?.error || "WhatsApp send failed. Please try again.",
      });
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="mb-8 bg-white rounded-2xl border border-emerald-200 px-5 py-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Test WhatsApp</h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Send a real WhatsApp message using one of your approved templates to make sure everything
        works. The contact must have opted in to receive messages from your number.
      </p>

      {/* Sending details */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Your WhatsApp sender number
          </label>
          <input
            value={sourceNumber}
            onChange={(e) => setSourceNumber(e.target.value)}
            placeholder="e.g. 919876543210 (country code, no +)"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Gupshup app name</label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Your app name on Gupshup"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Gupshup App ID</label>
            <input
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="App ID (to load templates)"
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={savingSettings || !sourceNumber.trim() || !appName.trim() || !appId.trim()}
            className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {savingSettings ? "Saving..." : "Save details"}
          </button>
          <a
            href="https://www.gupshup.io/whatsapp/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-600 hover:underline"
          >
            Where do I find these? →
          </a>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-3">
        {/* Template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-700">Template</label>
            <button
              onClick={loadTemplates}
              disabled={loadingTemplates || !settingsComplete}
              className="text-xs text-emerald-600 hover:underline disabled:opacity-40 disabled:no-underline"
            >
              {loadingTemplates ? "Loading..." : "Load my templates"}
            </button>
          </div>
          {templates.length > 0 ? (
            <select
              value={templateId}
              onChange={(e) => {
                const t = templates.find((x) => x.id === e.target.value);
                if (t) selectTemplate(t);
              }}
              className={inputCls}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-gray-400">
              {settingsComplete
                ? 'Click "Load my templates" to fetch your approved templates.'
                : "Save your sending details above first."}
            </p>
          )}
        </div>

        {/* Template variables */}
        {selected && selected.paramCount > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Fill in the blanks ({selected.paramCount})
            </label>
            {params.map((p, i) => (
              <input
                key={i}
                value={p}
                onChange={(e) => {
                  const next = [...params];
                  next[i] = e.target.value;
                  setParams(next);
                }}
                placeholder={`Value for {{${i + 1}}}`}
                className={inputCls}
              />
            ))}
          </div>
        )}

        {/* Preview */}
        {selected && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
            <p className="text-[11px] font-medium text-emerald-700 mb-1">Message preview</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">
              {fillPreview(selected.body, params)}
            </p>
          </div>
        )}

        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Send to</label>
          {contacts.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && setDestination(e.target.value)}
              className={`${inputCls} mb-2`}
            >
              <option value="">Pick a contact…</option>
              {contacts
                .filter((c) => c.phone)
                .map((c) => (
                  <option key={c.id} value={c.phone as string}>
                    {c.name || "Unnamed"} — {c.phone}
                  </option>
                ))}
            </select>
          )}
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Phone number with country code, e.g. 919876543210"
            className={inputCls}
          />
        </div>

        <button
          onClick={sendTest}
          disabled={sending || !destination.trim() || !templateId}
          className="w-full bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-40 transition-colors"
        >
          {sending ? "Sending..." : "Send test message"}
        </button>

        {result && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}
