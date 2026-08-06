import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";
import { SheepMark } from "@/components/SheepMark";
import { SignOutButton } from "@/components/SignOutButton";

export default async function JoinPage() {
  const user = await requireUser(); // signed in (may be pending)
  if (user.hallId) redirect("/home"); // already bound

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-flock-800 text-flock-50">
            <SheepMark className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-flock-800">
            Join your hall
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hey {user.username} — you&apos;re signed in, but not on a hall yet.
            Enter your hall&apos;s code to get started.
          </p>
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm">
          <JoinForm />
        </div>

        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
