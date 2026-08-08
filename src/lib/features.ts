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
    { label: "Spiritual Summaries", href: "/care", icon: "heart-handshake", desc: "Per-guy notes" },
    { label: "LEAD", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Trends", href: "/trends", icon: "trending-up", desc: "Attendance health" },
    { label: "Verses", href: "/verse", icon: "sparkle", desc: "For your CGLs" },
  ],
  LEADER: [
    { label: "Attendance", href: "/group", icon: "users", desc: "Your ~7 guys" },
    { label: "Spiritual Summaries", href: "/care", icon: "heart-handshake", desc: "Log check-ins" },
    { label: "LEAD", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Verses", href: "/verse", icon: "sparkle", desc: "For you & your guys" },
  ],
  MEMBER: [
    { label: "Prayer Requests", href: "/prayer", icon: "prayer", desc: "Send to your CGL" },
    { label: "Campcom Notes", href: "/notes", icon: "book-open", desc: "This week's passage" },
    { label: "Memory Verse", href: "/verse", icon: "sparkle", desc: "Verse of the week" },
  ],
};

// Overflow grid behind the "More" tab (RS/CGL only).
export const MORE_TILES: Record<Role, FeatureTile[]> = {
  ADMIN: [
    { label: "Attendance", href: "/attendance", icon: "check-square", desc: "All-hall roster" },
    { label: "People", href: "/people", icon: "user-round", desc: "Promote CGLs" },
    { label: "Group Maker", href: "/draft", icon: "shuffle", desc: "Assign groups" },
    { label: "CGL Status", href: "/hub", icon: "list-checks", desc: "Who's on track" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  LEADER: [
    { label: "Attendance", href: "/group", icon: "users", desc: "Your ~7 guys" },
    { label: "CGL Picker", href: "/picker", icon: "disc", desc: "Spin the wheel" },
    { label: "Resources", href: "/resources", icon: "link", desc: "Handy links" },
  ],
  MEMBER: [],
};
