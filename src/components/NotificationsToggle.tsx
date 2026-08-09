"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/lib/actions/push";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** VAPID public key (URL-safe base64) → Uint8Array for pushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "hidden" | "off" | "on" | "denied" | "busy";

export function NotificationsToggle() {
  const [state, setState] = useState<State>("hidden");
  const [needsInstall, setNeedsInstall] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported || !VAPID) return; // leave hidden

    // iOS only allows web push once the app is installed to the home screen.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !standalone) setNeedsInstall(true);

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then(async (reg) => {
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setState(sub ? "on" : "off");
      })
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    if (!VAPID) return;
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID) as BufferSource,
      });
      const keys = sub.toJSON().keys;
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: keys?.p256dh ?? "",
        auth: keys?.auth ?? "",
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "hidden") return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-flock-100 text-flock-700">
          {state === "on" ? (
            <BellRing className="h-5 w-5" aria-hidden />
          ) : (
            <Bell className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="text-xs text-muted">
            {state === "on"
              ? "On — you'll hear about prayer requests & new verses."
              : state === "denied"
                ? "Blocked in your browser settings."
                : needsInstall
                  ? "Add Flock to your home screen first, then turn on."
                  : "Get pinged for prayer requests & new verses."}
          </p>
        </div>
      </div>

      {state === "on" ? (
        <button
          onClick={disable}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-flock-50 hover:text-foreground"
        >
          Turn off
        </button>
      ) : state === "denied" ? null : (
        <button
          onClick={enable}
          disabled={state === "busy"}
          className="shrink-0 rounded-lg bg-flock-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-flock-800 disabled:opacity-70"
        >
          {state === "busy" ? "…" : "Turn on"}
        </button>
      )}
    </div>
  );
}
