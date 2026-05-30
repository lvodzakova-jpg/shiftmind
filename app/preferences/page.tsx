import { DatabaseError } from "@/components/DatabaseError";
import { PreferencesPageView } from "@/components/views/PreferencesPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";

export default async function PreferencesPage() {
  const supabase = createServerClient();

  const [{ data: employees, error: employeesError }, { data: preferences, error: prefError }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase.from(TABLES.preferences).select("*"),
    ]);

  const error = employeesError ?? prefError;

  if (error) {
    return <DatabaseError message={error.message} short />;
  }

  return (
    <PreferencesPageView
      staff={employees ?? []}
      preferences={preferences ?? []}
    />
  );
}
