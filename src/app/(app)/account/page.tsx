import { requireActiveUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function AccountPage() {
  const user = await requireActiveUser();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Account</h1>
        <p className="text-sm text-muted">
          Signed in as <span className="font-medium">{user.email}</span>.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Change password
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-muted">
          Enter your new password twice. You&apos;ll stay signed in.
        </p>
        <ResetPasswordForm variant="change" />
      </div>
    </section>
  );
}
