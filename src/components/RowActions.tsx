"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

/**
 * A "⋯" button that reveals a row's action buttons in a small dropdown, so a
 * long name isn't squeezed by four inline buttons. Closes on outside tap or
 * Escape. The children are the existing action buttons/forms, unchanged.
 */
export function RowActions({
  label,
  children,
}: {
  /** Whose row this is (for the button's accessible name). */
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      // Sheets opened from inside the menu are DOM children of it, so taps on
      // them (or their backdrops) don't count as "outside".
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        title="Actions"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-border p-1.5 text-muted hover:bg-flock-100 hover:text-flock-800"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 flex w-44 flex-col gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg [&_button]:w-full [&_button]:justify-start [&_form]:w-full"
        >
          {children}
        </div>
      )}
    </div>
  );
}
