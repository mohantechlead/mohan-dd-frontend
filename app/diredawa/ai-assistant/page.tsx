"use client";

import { Button } from "@/components/ui/button";
import { AiChatThread } from "@/components/ai-chat-thread";
import { useAiChat } from "@/hooks/use-ai-chat";

export default function AiAssistantPage() {
  const chat = useAiChat();
  const { conversationId, historyList, sending, startNewChat, clearHistory, openConversation } = chat;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="truncate text-xs text-muted-foreground">
            {conversationId ? `Conversation: ${conversationId}` : "No active conversation — ask anything to start."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={startNewChat} disabled={sending}>
          New chat
        </Button>
        <Button variant="outline" size="sm" onClick={clearHistory} disabled={sending || historyList.length === 0}>
          Clear history
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
        <div className="rounded-md border bg-white p-2">
          <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">
            History ({historyList.length})
          </p>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {historyList.length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">No saved conversations yet.</p>
            ) : (
              historyList.map(([id, conv]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openConversation(id)}
                  className={`block w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-muted ${
                    id === conversationId ? "bg-muted font-semibold" : ""
                  }`}
                  title={conv.preview}
                >
                  {conv.preview || id}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-[60vh] flex-col rounded-md border bg-white">
          <AiChatThread chat={chat} />
        </div>
      </div>
    </div>
  );
}
