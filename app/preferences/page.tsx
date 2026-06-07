export const dynamic = 'force-dynamic';
import { DatabaseError } from "@/components/DatabaseError";
import { PreferencesPageView } from "@/components/views/PreferencesPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Preference } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";

export default async function PreferencesPage() {
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = await createServerClient();

  const [{ data: employees, error: employeesError }, { data: preferences, error: prefError }] =
    await Promise.all([
      supabase
        .from(TABLES.employees)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .order("name"),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.preferences)
            .select("*")
            .in(COLS.employeeId, employeeIds)
        : Promise.resolve({ data: [] as Preference[], error: null }),
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
