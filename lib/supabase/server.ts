import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Chýbajú premenné NEXT_PUBLIC_SUPABASE_URL alebo ANON_KEY");
  }

  return createClient(url, key);
}
