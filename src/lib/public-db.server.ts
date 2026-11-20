import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Publishable (anon) values are safe to ship; reads go through anon grants and RLS.
const FALLBACK_URL = "https://ttcuicsbmujzpztexelw.supabase.co";
const FALLBACK_KEY = "sb_publishable_TTlrktQPupv9-baWbq7KBQ_zV7ts9Or";

/** Server-side public client: publishable key, no session, RLS applies. Call inside a handler. */
export function createPublicDb() {
  const url = process.env["SUPABASE_URL"] ?? FALLBACK_URL;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? FALLBACK_KEY;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
