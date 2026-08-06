import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getDraftBoard } from "@/lib/groups";
import { DraftBoard } from "@/components/DraftBoard";

export default async function DraftPage() {
  const user = await requireActiveUser();
  if (user.role !== "ADMIN") redirect("/home");

  const { groups, pool } = await getDraftBoard(user);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">
          Community Group Maker
        </h1>
        <p className="text-sm text-muted">
          Pick a CGL, then tap guys to draft them in.
        </p>
      </div>
      <DraftBoard groups={groups} pool={pool} />
    </section>
  );
}
