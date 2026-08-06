import { ExternalLink, Pin, PinOff, Trash2 } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getResources } from "@/lib/resources";
import {
  togglePinAction,
  deleteResourceAction,
} from "@/lib/actions/resources";
import { ResourceAddForm } from "@/components/ResourceAddForm";

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
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {r.pinned && (
                      <Pin
                        className="h-3 w-3 text-flock-600"
                        aria-label="Pinned"
                      />
                    )}
                    {r.label}
                  </p>
                  <p className="truncate text-xs text-muted">{r.url}</p>
                </div>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-flock-700"
                  aria-hidden
                />
              </a>

              {isAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  <form action={togglePinAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      aria-label={r.pinned ? "Unpin" : "Pin"}
                      className="rounded-lg p-1.5 text-muted hover:bg-flock-100 hover:text-flock-700"
                    >
                      {r.pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                  <form action={deleteResourceAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      aria-label="Delete"
                      className="rounded-lg p-1.5 text-muted hover:bg-absent/10 hover:text-absent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
