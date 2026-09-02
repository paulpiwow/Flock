import { redirect } from "next/navigation";
import { confirmAuthLink } from "@/lib/actions/auth";
import { SheepMark } from "@/components/SheepMark";

/**
 * Landing page for one-time auth links (today: the password-reset link an RS
 * texts to a student). Loading this page does NOT consume the token — it only
 * renders a Continue button, and the token is verified when that's clicked.
 * That's deliberate: browsers prefetch pasted URLs and messaging apps fetch
 * links for previews, and either would burn a one-time token before the
 * person ever sees the page.
 *
 * Accepts either form Supabase can produce:
 *   - ?token_hash=...&type=recovery  (RS reset link / {{ .TokenHash }} template)
 *   - ?code=...                      (default {{ .ConfirmationURL }} template)
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token_hash, type, code, next } = await searchParams;
  if (!(token_hash && type) && !code) redirect("/?error=link");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-flock-800 text-flock-50">
            <SheepMark className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-flock-800">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tap continue to choose a new password. This link works once.
          </p>
        </div>

        <form
          action={confirmAuthLink}
          className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm"
        >
          {token_hash && (
            <input type="hidden" name="token_hash" value={token_hash} />
          )}
          {type && <input type="hidden" name="type" value={type} />}
          {code && <input type="hidden" name="code" value={code} />}
          {next && <input type="hidden" name="next" value={next} />}
          <button
            type="submit"
            className="w-full rounded-xl bg-flock-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flock-800 active:bg-flock-800"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
