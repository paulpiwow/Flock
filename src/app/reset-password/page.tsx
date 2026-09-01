import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { SheepMark } from "@/components/SheepMark";
import { createClient } from "@/lib/supabase/server";

/**
 * Set a new password. Reached from the RS's reset link (via /auth/confirm),
 * which establishes a session first — so anyone here is signed in. Signed-out
 * visitors are bounced to login by the proxy before this renders.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-flock-800 text-flock-50">
            <SheepMark className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-flock-800">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose a new password for{" "}
            <span className="font-medium">{user.email}</span>.
          </p>
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
