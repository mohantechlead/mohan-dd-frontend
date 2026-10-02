"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { AiChatResponse, AiVisualization } from "@/lib/ai-assistant";

export type AiRole = "user" | "assistant";

export interface AiChatMessage {
  id: string;
  role: AiRole;
  content: string;
  data?: Record<string, unknown>[];
  visualization?: AiVisualization | null;
  error?: string | null;
  createdAt: string;
}

export interface StoredAiConversation {
  messages: AiChatMessage[];
  updatedAt: string;
  preview: string;
}

const CHAT_URL = "/api/ai/chat";
const STORAGE_HISTORY_KEY = "ai-chat-history-v1";
const STORAGE_CURRENT_KEY = "ai-chat-current-v1";

export function newAiId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory(): Record<string, StoredAiConversation> {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredAiConversation>) : {};
  } catch {
    return {};
  }
}

export function useAiChat() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, StoredAiConversation>>({});

  useEffect(() => {
    setHistory(loadHistory());
    try {
      const current = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (current) {
        const all = loadHistory();
        if (all[current]) {
          setConversationId(current);
          setMessages(all[current].messages);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((convId: string, msgs: AiChatMessage[]) => {
    try {
      const all = loadHistory();
      all[convId] = {
        messages: msgs,
        updatedAt: new Date().toISOString(),
        preview: msgs.find((m) => m.role === "user")?.content.slice(0, 80) ?? "Conversation",
      };
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(all));
      localStorage.setItem(STORAGE_CURRENT_KEY, convId);
      setHistory(all);
    } catch {
      // ignore quota errors
    }
  }, []);

  const send = useCallback(
    async (text?: string) => {
      const message = (text ?? input).trim();
      if (!message || sending) return;
      // Re-read current conversation so the widget and full page stay in sync.
      let activeConvId: string | null = conversationId;
      try {
        activeConvId = localStorage.getItem(STORAGE_CURRENT_KEY) ?? conversationId;
      } catch {
        // ignore
      }
      const userMsg: AiChatMessage = {
        id: newAiId(),
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      setSending(true);
      try {
        const res = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message,
            ...(activeConvId ? { conversation_id: activeConvId } : {}),
          }),
        });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail =
            (data as { detail?: string; message?: string })?.detail ||
            (data as { detail?: string; message?: string })?.message ||
            `Request failed (HTTP ${res.status})`;
          setMessages((prev) => [
            ...prev,
            {
              id: newAiId(),
              role: "assistant",
              content: "",
              error: String(detail),
              createdAt: new Date().toISOString(),
            },
          ]);
          showToast({ title: "AI request failed", description: String(detail), variant: "error" });
          return;
        }
        const payload = data as AiChatResponse & { conversation_id?: string };
        const nextConvId =
          typeof payload.conversation_id === "string" && payload.conversation_id.trim()
            ? payload.conversation_id.trim()
            : (activeConvId ?? newAiId());
        setConversationId(nextConvId);
        const assistantMsg: AiChatMessage = {
          id: newAiId(),
          role: "assistant",
          content: payload.message || "",
          data: Array.isArray(payload.data) ? payload.data : [],
          visualization: payload.visualization ?? null,
          createdAt: new Date().toISOString(),
        };
        const finalMsgs = [...next, assistantMsg];
        setMessages(finalMsgs);
        persist(nextConvId, finalMsgs);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: newAiId(),
            role: "assistant",
            content: "",
            error: err instanceof Error ? err.message : "Network error. Check backend is reachable.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, messages, conversationId, persist, showToast]
  );

  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    try {
      localStorage.removeItem(STORAGE_CURRENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
      localStorage.removeItem(STORAGE_CURRENT_KEY);
    } catch {
      // ignore
    }
    setHistory({});
    setMessages([]);
    setConversationId(null);
  }, []);

  const openConversation = useCallback((id: string) => {
    const all = loadHistory();
    const conv = all[id];
    if (!conv) return;
    setConversationId(id);
    setMessages(conv.messages);
    try {
      localStorage.setItem(STORAGE_CURRENT_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const historyList = useMemo(
    () =>
      Object.entries(history).sort(
        (a, b) => +new Date(b[1].updatedAt) - +new Date(a[1].updatedAt)
      ),
    [history]
  );

  return {
    messages,
    input,
    setInput,
    sending,
    conversationId,
    historyList,
    send,
    startNewChat,
    clearHistory,
    openConversation,
  };
}

export type UseAiChat = ReturnType<typeof useAiChat>;
