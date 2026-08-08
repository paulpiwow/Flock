"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Top-left Back button. Hidden on Home (the app's root). Uses history. */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === "/home") return null;

  return (
    <button
      onClick={() => router.back()}
      className="mb-3 -ml-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium text-muted transition-colors hover:text-flock-700"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      Back
    </button>
  );
}
