import type { Role } from "@/lib/roles";

export type FeatureTile = {
  label: string;
  href: string;
  icon: string;
  desc: string;
  /** external link (e.g. Beacon) opens in a new tab */
  external?: boolean;
};

// The launcher grid on Home — the friendly set of big tiles per role.
export const HOME_TILES: Record<Role, FeatureTile[]> = {
  ADMIN: [
    { label: "Attendance", href: "/attendance", icon: "check-square", desc: "All-hall roster" },
    { label: "Care Notes", href: "/care", icon: "heart-handshake", desc: "Notes & summaries" },
    { label: "Notes", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Trends", href: "/trends", icon: "trending-up", desc: "Attendance health" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  LEADER: [
    { label: "My Group", href: "/group", icon: "users", desc: "Your ~7 guys" },
    { label: "Care Notes", href: "/care", icon: "heart-handshake", desc: "Log check-ins" },
    { label: "Notes", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Hub", href: "/hub", icon: "list-checks", desc: "Your checklist" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  MEMBER: [
    { label: "Notes", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Memory Verse", href: "/verse", icon: "sparkle", desc: "Verse of the week" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
};

// Overflow grid behind the "More" tab (RS/CGL only).
export const MORE_TILES: Record<Role, FeatureTile[]> = {
  ADMIN: [
    { label: "Trends", href: "/trends", icon: "trending-up", desc: "Attendance over time" },
    { label: "Group Maker", href: "/draft", icon: "shuffle", desc: "Snake draft" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
    { label: "Beacon", href: "https://beacon.liberty.edu", icon: "external", desc: "File IRs", external: true },
  ],
  LEADER: [
    { label: "Hub", href: "/hub", icon: "list-checks", desc: "Your checklist" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "1-on-1s", href: "/hub", icon: "user-round", desc: "Track meetings" },
    { label: "LEAD Group", href: "/hub", icon: "calendar", desc: "Schedule & halves" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  MEMBER: [],
};
