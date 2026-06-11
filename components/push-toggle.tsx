"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { testPushAnMich } from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, start] = useTransition();

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      navigator.serviceWorker.register("/sw.js").then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "subscribed" : "unsubscribed");
      });
    });
  }, []);

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Benachrichtigungen wurden blockiert.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("subscribed");
      toast.success("Benachrichtigungen aktiviert!");
    } catch (e) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
      toast.success("Benachrichtigungen deaktiviert.");
    } catch (e) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  function handleTestPush() {
    start(async () => {
      const res = await testPushAnMich();
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else toast.success("Test-Push gesendet — sieh in die Benachrichtigungen.");
    });
  }

  if (status === "unsupported") {
    return (
      <p className="font-mono text-xs text-text-mute">
        Dein Browser unterstützt keine Push-Benachrichtigungen.
      </p>
    );
  }

  if (status === "loading") {
    return <Loader2 className="size-4 animate-spin text-text-mute" />;
  }

  if (status === "denied") {
    return (
      <p className="font-mono text-xs text-destructive">
        Benachrichtigungen wurden blockiert — in den Browser-Einstellungen wieder aktivieren.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={status === "subscribed" ? unsubscribe : subscribe}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 font-display text-sm font-bold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97]"
        style={
          status === "subscribed"
            ? {
                background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                borderColor: "color-mix(in srgb, var(--brand) 40%, transparent)",
                color: "var(--brand)",
              }
            : {
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }
        }
      >
        {status === "subscribed" ? (
          <Bell className="size-4" />
        ) : (
          <BellOff className="size-4 text-text-mute" />
        )}
        {status === "subscribed" ? "Aktiv" : "Aktivieren"}
      </button>

      {status === "subscribed" && (
        <button
          onClick={handleTestPush}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs text-text-dim transition-[transform,color,opacity] duration-150 hover:text-foreground active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          Test senden
        </button>
      )}
    </div>
  );
}
