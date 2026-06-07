"use client";

import { useState } from "react";
import type { ConversationItem } from "@/types";

type ConversationsPanelProps = {
  conversations: ConversationItem[];
  isLoading: boolean;
  activeConversationId: string | null;
  onLoadConversation: (conversationId: string) => void;
};

function getConversationTitle(conversation: ConversationItem) {
  return conversation.title?.trim() || "Untitled conversation";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ConversationsPanel({
  conversations,
  isLoading,
  activeConversationId,
  onLoadConversation,
}: ConversationsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleConversations = showAll
    ? conversations.slice(0, 10)
    : conversations.slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-950">
            Recent conversations
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Continue previous sessions
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
          {conversations.length}
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Loading...
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">
            No conversations yet.
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
            Your chats will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visibleConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onLoadConversation(conversation.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-800">
                    {getConversationTitle(conversation)}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-400">
                      {conversation.messages_count} messages
                    </span>

                    <span className="text-xs font-semibold text-slate-400">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {conversations.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-extrabold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {showAll ? "Show less" : "View all conversations"}
            </button>
          )}
        </>
      )}
    </section>
  );
}