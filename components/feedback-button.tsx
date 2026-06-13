"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, CheckCircle2 } from "lucide-react";
import { sendFeedback } from "@/lib/actions/feedback";

type Status = "idle" | "open" | "loading" | "done";

export function FeedbackButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "open") {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [status]);

  function open() {
    setStatus("open");
    setText("");
  }

  function close() {
    setStatus("idle");
    setText("");
  }

  function submit() {
    if (!text.trim() || status === "loading") return;
    setStatus("loading");
    startTransition(async () => {
      const res = await sendFeedback(text, pathname);
      if (res.ok) {
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2400);
      } else {
        setStatus("open");
      }
    });
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={open}
        aria-label="Feedback senden"
        className={`fixed z-50 flex items-center gap-2 rounded-full border border-border bg-surface-2/90 px-4 py-2.5 font-mono text-xs font-semibold text-text-dim shadow-lg backdrop-blur-md transition-[transform,opacity,box-shadow,border-color,color] duration-200 hover:border-brand/40 hover:text-foreground hover:shadow-brand/10 active:scale-[0.97]
          bottom-[88px] right-4
          lg:bottom-6 lg:right-6
          ${status !== "idle" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <MessageSquarePlus className="size-3.5 text-brand" />
        Feedback
      </button>

      {/* Backdrop */}
      {(status === "open" || status === "loading" || status === "done") && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Dialog */}
      {(status === "open" || status === "loading" || status === "done") && (
        <div
          className="fixed z-50 w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl"
          style={{
            background: "var(--surface-1)",
            bottom: "max(calc(env(safe-area-inset-bottom) + 96px), 24px)",
            right: "clamp(16px, 4vw, 24px)",
          }}
        >
          {status === "done" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="font-display text-lg font-extrabold">Danke!</p>
              <p className="text-sm text-text-dim">
                Feedback angekommen.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
                    Beta
                  </div>
                  <h2 className="font-display text-xl font-extrabold leading-tight">
                    Dein Feedback
                  </h2>
                  <p className="mt-1 text-xs text-text-mute">
                    Was nervt? Was fehlt? Was ist super?
                  </p>
                </div>
                <button
                  onClick={close}
                  className="shrink-0 rounded-xl p-1.5 text-text-mute transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder="Einfach drauf los schreiben…"
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none transition-colors focus:border-brand focus:bg-surface-3 placeholder:text-text-mute"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-text-mute">
                  {text.length > 0 && `${text.length}/2000`}
                  {text.length === 0 && "⌘↵ zum Senden"}
                </span>
                <button
                  onClick={submit}
                  disabled={!text.trim() || status === "loading"}
                  className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 font-display text-sm font-extrabold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="size-3.5" />
                  {status === "loading" ? "Sendet…" : "Senden"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
