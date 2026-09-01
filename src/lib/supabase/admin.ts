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

function adminClient() {
  if (!url || !serviceKey) return null; // not configured
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Mint a one-time password-recovery token for an email, without sending any
 * mail. Returns the hashed token to embed in a /auth/confirm link, or null if
 * the service key isn't configured. Throws on Supabase errors.
 */
export async function createRecoveryToken(
  email: string,
): Promise<string | null> {
  const admin = adminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) throw new Error(error.message);
  return data.properties.hashed_token;
}

/** Delete a Supabase Auth user by id. Returns true if actually deleted. */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  const admin = adminClient();
  if (!admin) return false;
  const { error } = await admin.auth.admin.deleteUser(userId);
  return !error;
}
