import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { MORE_TILES } from "@/lib/features";
import { FeatureGrid } from "@/components/FeatureGrid";
import type { Role } from "@/lib/roles";

export default async function MorePage() {
  const user = await requireActiveUser();
  const role = user.role as Role;
  const tiles = MORE_TILES[role];

  // Students have no "More" — bounce them home.
  if (tiles.length === 0) redirect("/home");

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold text-flock-800">More</h1>
      <FeatureGrid tiles={tiles} />
    </section>
  );
}
