import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { MORE_TILES } from "@/lib/features";
import { Icon } from "@/components/Icon";
import type { Role } from "@/lib/roles";

export default async function MorePage() {
  const user = await requireActiveUser();
  const role = user.role as Role;
  const tiles = MORE_TILES[role];

  // Students have no "More" — bounce them home.
  if (tiles.length === 0) redirect("/home");

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold text-flock-800">More</h1>

      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
        {tiles.map((t) => {
          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-flock-100 text-flock-700">
                <Icon name={t.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {t.label}
                </span>
                <span className="block text-xs text-muted">{t.desc}</span>
              </span>
              {t.external ? (
                <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              )}
            </>
          );
          const cls =
            "flex items-center gap-3 px-4 py-3 active:bg-flock-50";
          return (
            <li key={t.label}>
              {t.external ? (
                <a href={t.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={t.href} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
