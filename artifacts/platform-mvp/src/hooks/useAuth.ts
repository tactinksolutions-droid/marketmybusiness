import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import api from "../lib/api";

export interface Business {
  id: string;
  name: string;
  type: string;
  city: string;
  locality?: string;
  language?: string;
  plan?: string;
  brand_tone?: string;
  brand_color?: string;
  website_url?: string;
  whatsapp_connected?: boolean;
  gmb_connected?: boolean;
  instagram_connected?: boolean;
  facebook_connected?: boolean;
  youtube_connected?: boolean;
  linkedin_connected?: boolean;
  google_ads_connected?: boolean;
  gsc_connected?: boolean;
  email_connected?: boolean;
  google_analytics_connected?: boolean;
  merchant_connected?: boolean;
  claude_connected?: boolean;
  chatgpt_connected?: boolean;
  gemini_connected?: boolean;
  onboarding_complete?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        api.defaults.headers.common["Authorization"] = `Bearer ${session.access_token}`;
        fetchBusiness();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session) {
        api.defaults.headers.common["Authorization"] = `Bearer ${session.access_token}`;
        fetchBusiness();
      } else {
        setBusiness(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchBusiness() {
    try {
      const { data } = await api.get("/business/me");
      setBusiness(data.business);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }

  return { user, business, loading, refetch: fetchBusiness };
}
