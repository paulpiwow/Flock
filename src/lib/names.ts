/** Last word of a display name, for "alphabetize by last name" ordering. */
export function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? fullName).toLowerCase();
}

/** Last word of a name in its original case (for display). */
export function displayLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

/** A group's display name = its CGL's last name (e.g. "Cobb's Group"). */
export function groupLabel(
  leaderUsername: string | null | undefined,
  fallback = "Unassigned group",
): string {
  if (!leaderUsername) return fallback;
  return `${displayLastName(leaderUsername)}'s Group`;
}

/** Comparator: by last name, then full name. Matches the doc's roster ordering. */
export function byLastName(a: { username: string }, b: { username: string }) {
  const la = lastName(a.username);
  const lb = lastName(b.username);
  if (la !== lb) return la.localeCompare(lb);
  return a.username.localeCompare(b.username);
}
