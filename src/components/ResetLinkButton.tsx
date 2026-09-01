"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Check, Copy, KeyRound, Share2, X } from "lucide-react";
import { resetLinkAction, type ResetLinkState } from "@/lib/actions/people";
import { cn } from "@/lib/cn";

const initialState: ResetLinkState = {};

const noSubscribe = () => () => {};
const shareOnClient = () => "share" in navigator;
const shareOnServer = () => false;

/**
 * RS-side "Reset password": mints a one-time reset link and shows it in a
 * sheet with Share (opens Messages etc. on phones) and Copy. No email involved.
 */
export function ResetLinkButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    resetLinkAction,
    initialState,
  );
  // The sheet is open for any result the RS hasn't dismissed yet. Tracking the
  // dismissed result (rather than a boolean) means a fresh action result
  // re-opens it without needing an effect.
  const [dismissed, setDismissed] = useState<ResetLinkState | null>(null);
  const [copied, setCopied] = useState(false);
  const open = Boolean(state.link || state.error) && dismissed !== state;
  const canShare = useSyncExternalStore(
    noSubscribe,
    shareOnClient,
    shareOnServer,
  );

  function close() {
    setDismissed(state);
    setCopied(false);
  }

  const message = state.link
    ? `Here's your Flock password reset link (works once, expires in about an hour): ${state.link}`
    : "";

  async function copy() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the link is visible below to select manually.
    }
  }

  async function share() {
    if (!state.link) return;
    try {
      await navigator.share({ text: message });
    } catch {
      // User dismissed the share sheet.
    }
  }

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          aria-label="Reset password"
          title="Reset password"
          className={cn(
            "flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-flock-100 hover:text-flock-800",
            pending && "cursor-not-allowed opacity-60",
          )}
        >
          <KeyRound className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only sm:not-sr-only">Reset</span>
        </button>
      </form>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-link-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id="reset-link-title"
                className="text-base font-semibold text-foreground"
              >
                {state.error
                  ? "Couldn't make a reset link"
                  : `Reset link for ${state.username}`}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1 text-muted hover:bg-flock-100 hover:text-flock-800"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {state.error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-absent/10 px-3 py-2 text-xs font-medium text-absent"
              >
                {state.error}
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  Text this to them. It works once and expires in about an hour.
                  They&apos;ll open it and choose a new password.
                </p>
                <p className="mt-3 max-h-24 overflow-y-auto break-all rounded-lg border border-border bg-white px-3 py-2 font-mono text-[11px] text-foreground select-all">
                  {state.link}
                </p>
                <div className="mt-4 flex gap-2">
                  {canShare && (
                    <button
                      type="button"
                      onClick={share}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-flock-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-flock-800"
                    >
                      <Share2 className="h-4 w-4" aria-hidden />
                      Share
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={copy}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold",
                      canShare
                        ? "border border-flock-300 bg-flock-50 text-flock-800 hover:bg-flock-100"
                        : "bg-flock-700 text-white hover:bg-flock-800",
                    )}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
