import { ExternalLink, Trash2 } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getResources } from "@/lib/resources";
import { deleteResourceAction } from "@/lib/actions/resources";
import { ResourceAddForm } from "@/components/ResourceAddForm";

const AUDIENCE_LABEL: Record<string, string> = {
  ADMIN: "Only you",
  LEADERS: "You + CGLs",
  ALL: "Everyone",
};

export default async function ResourcesPage() {
  const user = await requireActiveUser();
  const resources = await getResources(user);
  const isAdmin = user.role === "ADMIN";

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Resources</h1>
        <p className="text-sm text-muted">
          The links people always need, in one place.
        </p>
      </div>

      {isAdmin && <ResourceAddForm />}

      {resources.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
          No resources yet.
          {isAdmin ? " Add the first one above." : ""}
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-card border border-border bg-surface p-3 shadow-sm"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-between gap-2 active:opacity-70"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {r.label}
                    </p>
                    {isAdmin && (
                      <span className="shrink-0 rounded-full bg-flock-100 px-2 py-0.5 text-[10px] font-medium text-flock-700">
                        {AUDIENCE_LABEL[r.audience]}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">{r.url}</p>
                </div>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-flock-700"
                  aria-hidden
                />
              </a>

              {isAdmin && !r.builtIn && (
                <form action={deleteResourceAction} className="shrink-0">
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    aria-label="Delete"
                    className="rounded-lg p-1.5 text-muted hover:bg-absent/10 hover:text-absent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
