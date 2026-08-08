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
    { label: "Prayer Requests", href: "/prayer", icon: "prayer", desc: "From your CGLs" },
    { label: "Spiritual Summaries", href: "/care", icon: "heart-handshake", desc: "Per-guy notes" },
    { label: "LEAD", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Verses", href: "/verse", icon: "sparkle", desc: "For your CGLs" },
    { label: "Trends", href: "/trends", icon: "trending-up", desc: "Attendance health" },
    { label: "Attendance", href: "/attendance", icon: "check-square", desc: "All-hall roster" },
  ],
  LEADER: [
    { label: "Prayer Requests", href: "/prayer", icon: "prayer", desc: "Your guys + send up" },
    { label: "Spiritual Summaries", href: "/care", icon: "heart-handshake", desc: "Log check-ins" },
    { label: "LEAD", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Verses", href: "/verse", icon: "sparkle", desc: "For you & your guys" },
  ],
  MEMBER: [
    { label: "Prayer Requests", href: "/prayer", icon: "prayer", desc: "Send to your CGL" },
    { label: "Memory Verse", href: "/verse", icon: "sparkle", desc: "Verse of the week" },
    { label: "Attendance", href: "/attendance", icon: "check-square", desc: "Check in Wednesday" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
};

// Overflow grid behind the "More" tab (RS/CGL only).
export const MORE_TILES: Record<Role, FeatureTile[]> = {
  ADMIN: [
    { label: "CGL Status", href: "/hub", icon: "list-checks", desc: "Who's on track" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "People", href: "/people", icon: "user-round", desc: "Promote CGLs" },
    { label: "Group Maker", href: "/draft", icon: "shuffle", desc: "Assign groups" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  LEADER: [
    { label: "Attendance", href: "/group", icon: "users", desc: "Your ~7 guys" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  MEMBER: [],
};
