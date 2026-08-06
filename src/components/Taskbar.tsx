"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TASKBAR, type Role } from "@/lib/roles";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

/**
 * Role-aware bottom taskbar. Because the app changes per role, the taskbar
 * changes too — 4–5 thumb-friendly icons, everything else under "More".
 */
export function Taskbar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = TASKBAR[role];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="safe-bottom mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-flock-700"
                    : "text-muted hover:text-flock-600",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  name={item.icon}
                  className={cn("h-5 w-5", active && "stroke-[2.5]")}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
