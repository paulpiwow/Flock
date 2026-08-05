// Role model + the role-aware navigation that is the backbone of Flock:
// the same login leads to three different experiences.

export type Role = "ADMIN" | "LEADER" | "MEMBER";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Resident Shepherd",
  LEADER: "Community Group Leader",
  MEMBER: "Student",
};

export const ROLE_SHORT: Record<Role, string> = {
  ADMIN: "RS",
  LEADER: "CGL",
  MEMBER: "Student",
};

export type NavItem = {
  label: string;
  href: string;
  /** lucide-style icon name; wired up in the taskbar component */
  icon: string;
};

// Bottom taskbar: 4–5 thumb-friendly icons per role, everything else under "More".
export const TASKBAR: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Home", href: "/home", icon: "home" },
    { label: "Attendance", href: "/attendance", icon: "check-square" },
    { label: "Care", href: "/care", icon: "heart-handshake" },
    { label: "Notes", href: "/notes", icon: "book-open" },
    { label: "More", href: "/more", icon: "grid" },
  ],
  LEADER: [
    { label: "Home", href: "/home", icon: "home" },
    { label: "My Group", href: "/group", icon: "users" },
    { label: "Notes", href: "/notes", icon: "book-open" },
    { label: "Hub", href: "/hub", icon: "list-checks" },
    { label: "More", href: "/more", icon: "grid" },
  ],
  MEMBER: [
    { label: "Home", href: "/home", icon: "home" },
    { label: "Notes", href: "/notes", icon: "book-open" },
    { label: "Verse", href: "/verse", icon: "sparkle" },
    { label: "Resources", href: "/resources", icon: "link" },
  ],
};

export function isAtLeast(role: Role, min: Role): boolean {
  const rank: Record<Role, number> = { MEMBER: 0, LEADER: 1, ADMIN: 2 };
  return rank[role] >= rank[min];
}
