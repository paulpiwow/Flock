import "server-only";

/**
 * Verse lookup via bible-api.com (World English Bible — public domain, no API
 * key). We only ever fetch a plain reference + text, never interpret it, in
 * keeping with Flock's no-AI / link-don't-reproduce stance. WEB avoids any
 * licensing burden.
 */

export type VerseLookup = { reference: string; text: string };

const NOT_FOUND =
  'Couldn’t find that reference. Try something like "John 15:5" or "Romans 8:1-4".';

export async function lookupVerse(reference: string): Promise<VerseLookup> {
  const q = reference.trim();
  if (!q) throw new Error("Enter a reference first.");

  let res: Response;
  try {
    res = await fetch(
      `https://bible-api.com/${encodeURIComponent(q)}?translation=web`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  } catch {
    throw new Error("Couldn’t reach the Bible service. Try again.");
  }

  if (res.status === 404) throw new Error(NOT_FOUND);
  if (!res.ok) throw new Error("Lookup failed. Try again in a moment.");

  const data = (await res.json()) as {
    reference?: string;
    text?: string;
    error?: string;
  };
  if (data.error || !data.text) throw new Error(NOT_FOUND);

  // Collapse the API's line breaks/verse spacing into a single clean paragraph.
  const text = data.text.replace(/\s+/g, " ").trim();
  return { reference: data.reference?.trim() || q, text };
}
