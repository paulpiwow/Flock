import Link from "next/link";
import { SheepMark } from "@/components/SheepMark";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-flock-800 text-flock-50 shadow-lg shadow-flock-800/20">
            <SheepMark className="h-12 w-12" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-flock-800">
            Flock
          </h1>
          <p className="mt-2 text-sm text-muted">
            Shepherding the hall — attendance, care notes, and weekly Scripture,
            all in one place.
          </p>
        </div>

        {/* Login card (visual preview — auth wired up in Phase 1) */}
        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-center text-lg font-semibold text-foreground">
            Welcome to Flock
          </h2>

          <form className="mt-5 space-y-4" action="/home">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Liberty email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@liberty.edu"
                pattern=".*@liberty\.edu$"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
              />
              <p className="mt-1 text-[11px] text-muted">
                Must end in <span className="font-medium">@liberty.edu</span>
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-flock-600 focus:ring-2 focus:ring-flock-300"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-flock-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flock-800 active:bg-flock-800"
            >
              Log In
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-flock-300 bg-flock-50 px-4 py-2.5 text-sm font-semibold text-flock-800 transition-colors hover:bg-flock-100"
            >
              Sign Up
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Liberty University · Resident Life
        </p>

        {/* Dev-only shortcut into the app shell while auth is being built */}
        <div className="mt-3 text-center">
          <Link
            href="/home"
            className="text-xs font-medium text-flock-600 underline-offset-4 hover:underline"
          >
            Preview the app →
          </Link>
        </div>
      </div>
    </main>
  );
}
