import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🌿
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">GrowIQ</h1>
          <p className="text-gray-500 text-sm mt-1">AI marketing for growing businesses</p>
        </div>

        {!sent ? (
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Continue with email"}
            </button>
            {error && (
              <p className="text-center text-xs text-red-600 mt-3 break-words">
                {error}
              </p>
            )}
            <p className="text-center text-xs text-gray-400 mt-4">
              No password needed — we'll send a magic link
            </p>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-sm text-gray-500">
              Magic link sent to <strong>{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
