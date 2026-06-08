import { useEffect, useState } from "react";
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

const segmentColors: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  warm: "bg-amber-50 text-amber-700",
  hot: "bg-red-50 text-red-700",
  vip: "bg-purple-50 text-purple-700",
  dormant: "bg-gray-100 text-gray-500",
};

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/contacts")
      .then(({ data }) => {
        setContacts(data.contacts || []);
        setSegments(data.segments || {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? contacts.filter((c) => c.segment === filter)
    : contacts;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ViewHeader
        title="Contacts"
        subtitle={`${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"} in your audience`}
      />

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
            Ask the assistant to import contacts to get started.
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
    </div>
  );
}
