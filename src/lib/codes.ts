/** Normalize a hall join code: trim + uppercase (codes look like HALL3-F26). */
export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase();
}
