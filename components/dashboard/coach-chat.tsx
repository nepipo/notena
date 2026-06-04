"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, Bot } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER = "Was steht heute an — wie kann ich helfen?";

export function CoachChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: STARTER },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Msg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Msg = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Fehler vom Coach-Server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: accumulated } : m,
          ),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: "Fehler — bitte nochmal versuchen." }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      start(() => void send());
    }
  }

  return (
    <section
      className="animate-fade-up rounded-[28px] border border-border"
      style={{ background: "var(--card-grad)", animationDelay: "0.08s" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 sm:px-6">
        <Bot className="size-4 text-brand" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          KI-Coach
        </span>
        <span className="ml-auto font-mono text-[9px] text-text-mute">Haiku 4.5</span>
      </div>

      {/* Nachrichten */}
      <div className="max-h-72 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm font-medium text-black"
                    : "rounded-bl-sm text-foreground"
                }`}
                style={
                  m.role === "user"
                    ? { background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }
                    : { background: "var(--surface-2)" }
                }
              >
                {m.content || (
                  <span className="flex items-center gap-1.5 text-text-mute">
                    <Loader2 className="size-3 animate-spin" />
                    denkt nach…
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Eingabe */}
      <div className="flex items-end gap-2 border-t border-border px-4 py-3 sm:px-5">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Frag mich was…"
          rows={1}
          disabled={streaming}
          className="flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-foreground placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
          style={{ maxHeight: "96px", overflowY: "auto" }}
        />
        <button
          onClick={() => start(() => void send())}
          disabled={!input.trim() || streaming}
          className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
            boxShadow: input.trim() ? "0 4px 14px color-mix(in srgb, var(--brand) 40%, transparent)" : "none",
          }}
        >
          {streaming ? (
            <Loader2 className="size-4 animate-spin text-black" />
          ) : (
            <Send className="size-4 text-black" />
          )}
        </button>
      </div>
    </section>
  );
}
