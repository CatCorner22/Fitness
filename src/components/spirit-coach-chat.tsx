"use client";

import Link from "next/link";
import { useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { SpiritMascot } from "@/components/spirit-mascot";
import { parseCoachMeta, textFromUIMessageParts } from "@/lib/spirit/client-utils";

const PROMPTS = [
  "Are bench dips good for triceps?",
  "I'm short on time — what can I drop?",
  "Swap for a sore shoulder?",
];

function messageText(message: UIMessage) {
  return textFromUIMessageParts(message.parts);
}

export function SpiritCoachChat({
  initialMessages,
  aiAvailable,
}: {
  initialMessages: UIMessage[];
  aiAvailable: boolean;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/spirit/chat" }),
  });

  const streaming = status === "streaming" || status === "submitted";

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={streaming}
            onClick={() => {
              sendMessage({ text: prompt });
            }}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:border-copper/40 hover:text-copper-2 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
            <SpiritMascot mood="encouraging" size={48} />
            <p>Ask about swaps, volume, pole prep, protein, or rest. Spirit cites the knowledge base when it matters.</p>
          </div>
        )}
        {messages.map((msg) => {
          const raw = messageText(msg);
          const isStreamingAssistant =
            msg.role === "assistant" && streaming && msg.id === messages.at(-1)?.id;
          const parsed =
            msg.role === "assistant" && !isStreamingAssistant ? parseCoachMeta(raw) : { text: raw, citeIds: [] as string[] };
          const metaCiteIds = (msg.metadata as { citeIds?: string[] } | undefined)?.citeIds;
          const citeIds = metaCiteIds?.length ? metaCiteIds : parsed.citeIds;
          return (
            <article
              key={msg.id}
              className={`rounded-2xl p-4 text-sm ${
                msg.role === "user" ? "ml-8 bg-surface-2" : "mr-8 border border-line bg-surface"
              }`}
            >
              <p className="text-xs uppercase text-muted">{msg.role === "user" ? "You" : "Spirit"}</p>
              <p className="mt-1 whitespace-pre-wrap">
                {parsed.text || (isStreamingAssistant ? "*ears perk* ..." : "")}
              </p>
              {citeIds.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {citeIds.map((id, i) => (
                    <Link key={`${id}-${i}`} href={`/knowledge#${id}`} className="text-[10px] text-copper-2">
                      {id}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-copper">{error.message}</p> : null}

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = input.trim();
          if (!q || streaming) return;
          sendMessage({ text: q });
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about swaps, volume, pole prep, protein, rest..."
          disabled={streaming}
        />
        <button
          className="rounded-2xl bg-copper px-4 text-sm font-semibold text-bg disabled:opacity-60"
          type="submit"
          disabled={streaming || !input.trim()}
        >
          {streaming ? "Spirit..." : "Ask Spirit"}
        </button>
      </form>

      {!aiAvailable ? (
        <p className="mt-2 text-xs text-muted">
          Local rules + the guide always answer. A cloud model is optional under You.
        </p>
      ) : null}
    </>
  );
}
