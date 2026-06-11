import { useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api";
import type { Business } from "./useAuth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionData | null;
  time: string;
}

export interface ActionData {
  intent: string;
  channel?: string;
  segment?: string;
  contact_count?: number;
  message_draft?: string;
  campaign_type?: string;
  campaign_id?: string;
  status?: string;
}

export function useChat(business: Business | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const { data } = await api.get("/chat/history");
      if (data.messages?.length) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            action: m.action_data,
            time: m.created_at,
          }))
        );
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            time: new Date().toISOString(),
            content: business?.onboarding_complete
              ? `Welcome back! 🌱 What would you like to work on today for ${business?.name || "your business"}?`
              : `Welcome to MarketMyBusiness! 🌿 I'm going to help set up your account. It takes about 2 minutes. What's the name of your business?`,
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMessage = {
        id: Date.now() + "",
        role: "user",
        content: text,
        time: new Date().toISOString(),
      };
      let snapshot: ChatMessage[] = [];
      setMessages((p) => {
        snapshot = p;
        return [...p, userMsg];
      });
      setLoading(true);
      try {
        const { data } = await api.post("/chat", {
          message: text,
          history: snapshot.map((m) => ({ role: m.role, content: m.content })),
        });
        setMessages((p) => [
          ...p,
          {
            id: Date.now() + 1 + "",
            role: "assistant",
            content: data.message,
            action: data.action,
            time: new Date().toISOString(),
          },
        ]);
        if (
          data.action?.status === "draft_created" ||
          data.action?.status?.includes("draft")
        ) {
          setPendingAction({ ...data.action, campaign_id: data.actionResult?.campaign_id });
        }
        if (data.onboarding_complete) window.location.reload();
      } catch {
        setMessages((p) => [
          ...p,
          {
            id: Date.now() + "",
            role: "assistant",
            content: "Something went wrong on my end. Please try again.",
            time: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  async function approve(id: string) {
    try {
      const { data } = await api.post(`/integrations/campaigns/${id}/send`);
      setPendingAction(null);
      send(data?.message || "The campaign was sent. Please confirm.");
    } catch (err: any) {
      setPendingAction(null);
      send(err?.response?.data?.error || "The campaign could not be sent.");
    }
  }

  return { messages, loading, pendingAction, setPendingAction, send, approve, bottomRef };
}
