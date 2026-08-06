import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { FeatureTile } from "@/lib/features";

export function FeatureGrid({ tiles }: { tiles: FeatureTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => {
        const inner = (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-flock-100 text-flock-700">
              <Icon name={tile.icon} className="h-5 w-5" />
            </span>
            <span className="mt-3 block text-sm font-semibold text-foreground">
              {tile.label}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{tile.desc}</span>
          </>
        );

        const cls =
          "group rounded-card border border-border bg-surface p-4 shadow-sm transition-colors hover:border-flock-300 hover:bg-flock-50 active:bg-flock-100";

        return tile.external ? (
          <a
            key={tile.label}
            href={tile.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            {inner}
          </a>
        ) : (
          <Link key={tile.label} href={tile.href} className={cls}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
