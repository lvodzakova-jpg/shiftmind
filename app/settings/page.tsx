import { DatabaseError } from "@/components/DatabaseError";
import { SettingsPageView } from "@/components/views/SettingsPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from(TABLES.branchSettings)
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    return <DatabaseError message={error.message} short />;
  }

  return <SettingsPageView settings={(data as BranchSettings) ?? null} />;
}
