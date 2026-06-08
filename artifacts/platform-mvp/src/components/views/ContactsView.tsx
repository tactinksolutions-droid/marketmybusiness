import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  segment: string;
  interest_level: string;
  source: string;
  last_contacted?: string | null;
  total_interactions: number;
}

interface ParsedContact {
  name: string;
  phone?: string;
  email?: string;
  last_contacted?: string;
}

const segmentColors: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  warm: "bg-amber-50 text-amber-700",
  hot: "bg-red-50 text-red-700",
  vip: "bg-purple-50 text-purple-700",
  dormant: "bg-gray-100 text-gray-500",
};

// Quote-aware CSV tokenizer: handles commas inside quotes, escaped quotes
// (""), and newlines inside quoted fields.
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      pushField();
      i++;
    } else if (ch === "\r") {
      i++;
    } else if (ch === "\n") {
      pushRow();
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const HEADER_ALIASES: Record<keyof ParsedContact, string[]> = {
  name: ["name", "full name", "contact name", "customer name"],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "number",
    "whatsapp",
    "whatsapp number",
    "contact number",
  ],
  email: ["email", "email address", "mail", "e mail"],
  last_contacted: [
    "last contacted",
    "last contact",
    "last contacted date",
    "lastcontacted",
  ],
};

const normalizeHeader = (h: string) =>
  h.toLowerCase().replace(/[\s_-]+/g, " ").trim();

function parseCsv(text: string): ParsedContact[] {
  const rows = tokenizeCsv(text);
  if (rows.length === 0) return [];

  const headerCells = rows[0].map((c) => normalizeHeader(c));
  const idxOf = (key: keyof ParsedContact) =>
    headerCells.findIndex((h) => HEADER_ALIASES[key].includes(h));

  const nameIdx = idxOf("name");
  const phoneIdx = idxOf("phone");
  const emailIdx = idxOf("email");
  const lastIdx = idxOf("last_contacted");

  // If no recognizable header, assume positional: name, phone, email, last_contacted
  const hasHeader = nameIdx !== -1 || phoneIdx !== -1 || emailIdx !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const ni = nameIdx !== -1 ? nameIdx : 0;
  const pi = phoneIdx !== -1 ? phoneIdx : 1;
  const ei = emailIdx !== -1 ? emailIdx : 2;
  const li = lastIdx !== -1 ? lastIdx : 3;

  const out: ParsedContact[] = [];
  for (const cells of dataRows) {
    const name = (cells[ni] || "").trim();
    const phone = (cells[pi] || "").trim();
    const email = (cells[ei] || "").trim();
    const last = (cells[li] || "").trim();
    if (!phone && !email) continue;
    out.push({
      name: name || phone || email,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(last ? { last_contacted: last } : {}),
    });
  }
  return out;
}

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadContacts(): Promise<boolean> {
    try {
      const { data } = await api.get("/contacts");
      setContacts(data.contacts || []);
      setSegments(data.segments || {});
      setError(false);
      return true;
    } catch {
      setError(true);
      return false;
    }
  }

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) e.target.value = "";
    if (!file) return;

    setImportMsg(null);
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setImportMsg({
          type: "error",
          text: "No valid rows found. Make sure your file has phone or email columns.",
        });
        return;
      }
      const { data } = await api.post("/contacts/import", { contacts: parsed });
      const imported = data?.imported ?? 0;
      const skipped = Math.max(parsed.length - imported, 0);
      const reloaded = await loadContacts();
      let msg =
        imported > 0
          ? `Imported ${imported} contact${imported === 1 ? "" : "s"}` +
            (skipped > 0
              ? `, skipped ${skipped} duplicate or existing.`
              : ".")
          : "No new contacts added — they may already be in your audience.";
      if (!reloaded) msg += " Refresh to see the latest list.";
      setImportMsg({ type: "success", text: msg });
    } catch {
      setImportMsg({
        type: "error",
        text: "Import failed. Please check the file format and try again.",
      });
    } finally {
      setImporting(false);
    }
  }

  const filtered = filter
    ? contacts.filter((c) => c.segment === filter)
    : contacts;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <ViewHeader
          title="Contacts"
          subtitle={`${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"} in your audience`}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex-shrink-0 bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60"
        >
          {importing ? "Importing..." : "+ Import CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {importMsg && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            importMsg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {importMsg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !filter ? "bg-green-700 text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          All ({contacts.length})
        </button>
        {Object.entries(segments).map(([seg, count]) => (
          <button
            key={seg}
            onClick={() => setFilter(seg)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === seg
                ? "bg-green-700 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {seg} ({count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading contacts...</p>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-600">Couldn't load contacts.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again in a moment.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-3xl mb-2">👥</div>
          <p className="text-sm text-gray-500">No contacts yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Import a CSV above, or ask the assistant to add contacts to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Interactions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    {c.email && (
                      <p className="text-xs text-gray-400">{c.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        segmentColors[c.segment] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{c.source}</td>
                  <td className="px-4 py-3 text-gray-500">{c.total_interactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-4">
        <p className="text-xs font-medium text-amber-800 mb-2">CSV format guide</p>
        <p className="text-xs text-amber-700 font-mono">
          name, phone, email, last_contacted
        </p>
        <p className="text-xs text-amber-600 mt-1.5">
          Column headers are auto-detected. Phone and email are enough to get started.
        </p>
      </div>
    </div>
  );
}
