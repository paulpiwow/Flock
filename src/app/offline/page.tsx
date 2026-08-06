import { SheepMark } from "@/components/SheepMark";

export const metadata = { title: "Offline · Flock" };

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-flock-100 text-flock-700">
        <SheepMark className="h-10 w-10" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-flock-800">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Flock needs a connection for this. Check your Wi-Fi or data and try again.
      </p>
    </main>
  );
}
