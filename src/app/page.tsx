import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { SheepMark } from "@/components/SheepMark";
import { getCurrentUser } from "@/lib/auth";

const LINK_ERRORS: Record<string, string> = {
  link: 'That link is invalid or has expired. Use "Forgot password?" to request a new one.',
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Skip the login screen.
  const user = await getCurrentUser();
  if (user) redirect("/home");

  const { error } = await searchParams;
  const initialError = error ? LINK_ERRORS[error] : undefined;

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
          <p className="mt-2 text-sm text-muted">Shepherding The Hall</p>
        </div>

        {/* Login / Sign up */}
        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-center text-lg font-semibold text-foreground">
            Welcome to Flock
          </h2>
          <AuthForm initialError={initialError} />
        </div>
      </div>
    </main>
  );
}
