"use client";

import { useState } from "react";
import { MessageCircle, X, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AiChatThread } from "@/components/ai-chat-thread";
import { useAiChat } from "@/hooks/use-ai-chat";

/** Floating bottom-right AI chat panel. Shares conversation history with the full page. */
export function AiChatWidget() {
  const chat = useAiChat();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
      {open ? (
        <div className="flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b bg-primary px-3 py-2 text-primary-foreground">
            <MessageCircle className="size-4" />
            <p className="flex-1 truncate text-sm font-semibold">AI Assistant</p>
            <button
              type="button"
              title="Open full page"
              onClick={() => {
                setOpen(false);
                router.push("/diredawa/ai-assistant");
              }}
              className="rounded p-1 hover:bg-primary-foreground/20"
            >
              <Maximize2 className="size-4" />
            </button>
            <button
              type="button"
              title="New chat"
              onClick={() => chat.startNewChat()}
              className="rounded px-1.5 py-0.5 text-xs hover:bg-primary-foreground/20"
            >
              New
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-primary-foreground/20"
            >
              <X className="size-4" />
            </button>
          </div>
          <AiChatThread chat={chat} compact />
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative h-12 w-12 rounded-full shadow-lg"
        title={open ? "Close AI chat" : "Open AI chat"}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
