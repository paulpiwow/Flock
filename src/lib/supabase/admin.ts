import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role admin client for privileged auth operations (deleting a user's
 * login). Server-only; never import into client code. Needs the
 * SUPABASE_SERVICE_ROLE_KEY env var — if it's absent, auth deletion is skipped
 * and the caller falls back to just removing the app record.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Delete a Supabase Auth user by id. Returns true if actually deleted. */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  if (!url || !serviceKey) return false; // not configured
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  return !error;
}
