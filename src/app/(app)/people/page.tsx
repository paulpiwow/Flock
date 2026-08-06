import { redirect } from "next/navigation";
import { ArrowDownRight, UserPlus } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getPeople } from "@/lib/people";
import {
  promoteToCglAction,
  demoteToStudentAction,
} from "@/lib/actions/people";

export default async function PeoplePage() {
  const user = await requireActiveUser();
  if (user.role !== "ADMIN") redirect("/home");

  const { cgls, students } = await getPeople(user);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-flock-800">People</h1>
        <p className="text-sm text-muted">
          Promote a student to CGL, or demote a CGL back.
        </p>
      </div>

      {/* CGLs */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Community Group Leaders ({cgls.length})
        </h2>
        {cgls.length === 0 ? (
          <p className="text-sm text-muted">No CGLs yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {cgls.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {c.username}
                  </p>
                  <p className="text-xs text-muted">
                    {c.groupName ?? "No group"}
                  </p>
                </div>
                <form action={demoteToStudentAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-absent/10 hover:text-absent"
                  >
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                    Demote
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Students */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Students ({students.length})
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {students.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {s.username}
                </p>
                <p className="text-xs text-muted">{s.groupName ?? "No group"}</p>
              </div>
              <form action={promoteToCglAction}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg border border-flock-300 bg-flock-50 px-2.5 py-1.5 text-xs font-semibold text-flock-800 hover:bg-flock-100"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Make CGL
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          Making a CGL gives them a new group to lead — draft their guys in with
          the Group Maker.
        </p>
      </div>
    </section>
  );
}
