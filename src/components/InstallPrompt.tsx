"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "flock-install-dismissed";

/** "Install Flock" banner — Chrome/Android button, iOS Add-to-Home-Screen hint. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Already installed (standalone) or previously dismissed → don't show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone || localStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|android/i.test(ua);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIOS && isSafari) {
      setShowIosHint(true);
      setHidden(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  };

  if (hidden || (!deferred && !showIosHint)) return null;

  return (
    <div className="flex items-center gap-3 rounded-card border border-flock-300 bg-flock-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-flock-700 text-white">
        <Download className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-flock-800">Install Flock</p>
        {deferred ? (
          <p className="text-xs text-muted">Add it to your phone like an app.</p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-muted">
            Tap <Share className="inline h-3.5 w-3.5" aria-hidden /> then
            &ldquo;Add to Home Screen.&rdquo;
          </p>
        )}
      </div>
      {deferred && (
        <button
          onClick={install}
          className="shrink-0 rounded-lg bg-flock-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-flock-800"
        >
          Install
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-muted hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
