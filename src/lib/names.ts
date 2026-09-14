import { z } from "zod";

/**
 * One place for "how do we show and sort a person".
 *
 * `username` is the signup-era handle (or the email prefix). `firstName` /
 * `lastName` are the real name from the one-time prompt or an RS edit. Rule:
 * display and sort by the real name when it exists, else fall back to username.
 */

export type Named = {
  username: string;
  firstName: string | null;
  lastName: string | null;
};

/** Spread into a Prisma `select` so a row satisfies `Named`. */
export const NAME_SELECT = {
  username: true,
  firstName: true,
  lastName: true,
} as const;

/** True once both real-name fields are filled in. */
export function hasRealName(u: Named): boolean {
  return !!u.firstName?.trim() && !!u.lastName?.trim();
}

/** "First Last" when known, else the username. */
export function displayName(u: Named): string {
  return hasRealName(u) ? `${u.firstName!.trim()} ${u.lastName!.trim()}` : u.username;
}

/** Last word of a string (for parsing a username like "Ty Jenkins" or "bean"). */
function lastWord(s: string): string {
  const parts = s.trim().split(/\s+/);
  return parts[parts.length - 1] ?? s;
}

/** Last name in its original case: the column when set, else the username's last word. */
export function displayLastName(u: Named): string {
  return u.lastName?.trim() || lastWord(u.username);
}

/** Lowercased last name for "alphabetize by last name" ordering. */
export function sortLastName(u: Named): string {
  return displayLastName(u).toLowerCase();
}

/** A group's display name = its CGL's last name (e.g. "Cobb's Group"). */
export function groupLabel(
  leader: Named | null | undefined,
  fallback = "Unassigned group",
): string {
  if (!leader) return fallback;
  return `${displayLastName(leader)}'s Group`;
}

/** Comparator: by last name, then full display name. Matches the doc's roster ordering. */
export function byLastName(a: Named, b: Named) {
  const la = sortLastName(a);
  const lb = sortLastName(b);
  if (la !== lb) return la.localeCompare(lb);
  return displayName(a).localeCompare(displayName(b));
}

const namePart = z
  .string()
  .trim()
  .min(1, "Enter both a first and last name.")
  .max(40, "That name is too long.")
  .regex(/^[\p{L}][\p{L}' .-]*$/u, "Letters only, please.");

/** First + last name form input (name prompt, RS edit-name). */
export const fullNameSchema = z.object({
  firstName: namePart,
  lastName: namePart,
});
