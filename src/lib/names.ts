/** Last word of a display name, for "alphabetize by last name" ordering. */
export function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? fullName).toLowerCase();
}

/** Comparator: by last name, then full name. Matches the doc's roster ordering. */
export function byLastName(a: { username: string }, b: { username: string }) {
  const la = lastName(a.username);
  const lb = lastName(b.username);
  if (la !== lb) return la.localeCompare(lb);
  return a.username.localeCompare(b.username);
}
