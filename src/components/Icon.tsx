import {
  BookOpen,
  Calendar,
  CheckSquare,
  Disc3,
  ExternalLink,
  HeartHandshake,
  Home,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  Shuffle,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

// Map the string icon names used across configs to lucide components.
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  "check-square": CheckSquare,
  "heart-handshake": HeartHandshake,
  "book-open": BookOpen,
  grid: LayoutGrid,
  users: Users,
  "list-checks": ListChecks,
  sparkle: Sparkles,
  link: LinkIcon,
  "trending-up": TrendingUp,
  disc: Disc3,
  shuffle: Shuffle,
  external: ExternalLink,
  "user-round": UserRound,
  calendar: Calendar,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? Home;
  return <Cmp className={className} aria-hidden />;
}
