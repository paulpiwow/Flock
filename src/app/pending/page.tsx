import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SheepMark } from "@/components/SheepMark";
import { SignOutButton } from "@/components/SignOutButton";

export default async function PendingPage() {
  const user = await requireUser(); // signed in
  if (!user.hallId) redirect("/join"); // needs a hall first
  if (user.role === "ADMIN" || user.approvedAt) redirect("/home"); // already in

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-flock-800 text-flock-50">
            <SheepMark className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-flock-800">
            Almost there
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hey {user.username} — you&apos;re all signed up. Your RS just needs to
            approve your account before you can jump in. Check back shortly.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
