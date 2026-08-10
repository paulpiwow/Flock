import { redirect } from "next/navigation";
import { ArrowDownRight, Check, Trash2, UserPlus, X } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getPeople } from "@/lib/people";
import {
  promoteToCglAction,
  demoteToStudentAction,
  approveUserAction,
  removeUserAction,
} from "@/lib/actions/people";

function Approve({ id }: { id: string }) {
  return (
    <form action={approveUserAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg border border-flock-300 bg-flock-50 px-2.5 py-1.5 text-xs font-semibold text-flock-800 hover:bg-flock-100"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        Approve
      </button>
    </form>
  );
}

function Deny({ id }: { id: string }) {
  return (
    <form action={removeUserAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-absent/10 hover:text-absent"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Deny
      </button>
    </form>
  );
}

function Remove({ id }: { id: string }) {
  return (
    <form action={removeUserAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Remove"
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-absent/10 hover:text-absent"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Remove
      </button>
    </form>
  );
}

function MakeCgl({ id }: { id: string }) {
  return (
    <form action={promoteToCglAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg border border-flock-300 bg-flock-50 px-2.5 py-1.5 text-xs font-semibold text-flock-800 hover:bg-flock-100"
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        Make CGL
      </button>
    </form>
  );
}

function Demote({ id }: { id: string }) {
  return (
    <form action={demoteToStudentAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-absent/10 hover:text-absent"
      >
        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
        Demote
      </button>
    </form>
  );
}

function Row({
  name,
  subtitle,
  children,
}: {
  name: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}

export default async function PeoplePage() {
  const user = await requireActiveUser();
  if (user.role !== "ADMIN") redirect("/home");

  const { pending, admins, cgls, students } = await getPeople(user);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-flock-800">People</h1>
        <p className="text-sm text-muted">
          Manage who&apos;s an RS, a CGL, or a student.
        </p>
      </div>

      {/* Pending approval — new signups awaiting the RS's OK */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Pending approval ({pending.length})
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-flock-300 bg-surface">
            {pending.map((p) => (
              <Row key={p.id} name={p.username} subtitle={p.email}>
                <Approve id={p.id} />
                <Deny id={p.id} />
              </Row>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            New signups can&apos;t get in until you approve them. Deny permanently
            deletes the account.
          </p>
        </div>
      )}

      {/* Resident Shepherds */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Resident Shepherds ({admins.length})
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {admins.map((a) => (
            <Row
              key={a.id}
              name={a.username}
              subtitle={a.id === user.id ? "You" : "Resident Shepherd"}
            >
              {a.id !== user.id && <Demote id={a.id} />}
            </Row>
          ))}
        </ul>
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
              <Row key={c.id} name={c.username} subtitle={c.groupName ?? "No group"}>
                <Demote id={c.id} />
              </Row>
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
            <Row key={s.id} name={s.username} subtitle={s.groupName ?? "No group"}>
              <MakeCgl id={s.id} />
              <Remove id={s.id} />
            </Row>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          Making a CGL creates a new group for them to lead — draft their guys in
          with the Group Maker.
        </p>
      </div>
    </section>
  );
}
