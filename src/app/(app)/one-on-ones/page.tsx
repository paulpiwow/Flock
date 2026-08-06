import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getMyOneOnOnes } from "@/lib/oneonone";
import { OneOnOneRoster, type Guy } from "@/components/OneOnOneRoster";

function lastMetLabel(d: Date | null): string {
  if (!d) return "Not met yet";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Last met today";
  if (days === 1) return "Last met yesterday";
  if (days < 21) return `Last met ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `Last met ${weeks} weeks ago`;
}

export default async function OneOnOnesPage() {
  const user = await requireActiveUser();
  if (user.role !== "LEADER") redirect("/home");

  const { group, guys } = await getMyOneOnOnes(user);
  const needsCount = guys.filter((g) => g.needsNudge).length;

  const items: Guy[] = guys.map((g) => ({
    id: g.id,
    username: g.username,
    lastMetLabel: lastMetLabel(g.lastMet),
    needsNudge: g.needsNudge,
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">1-on-1s</h1>
        <p className="text-sm text-muted">
          {group ? `${group.name} · ` : ""}
          {needsCount > 0
            ? `${needsCount} guy${needsCount === 1 ? "" : "s"} to catch up with`
            : "Everyone's been met with recently 🙌"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
          {group ? "No guys in your group yet." : "You're not leading a group."}
        </p>
      ) : (
        <OneOnOneRoster guys={items} />
      )}
    </section>
  );
}
