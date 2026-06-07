export const dynamic = 'force-dynamic';
import { DatabaseError } from "@/components/DatabaseError";
import { StaffPageView } from "@/components/views/StaffPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace-server";

export default async function StaffPage() {
  const workspaceId = await ensureWorkspace();
  const supabase = await createServerClient();
  const { data: employees, error } = await supabase
    .from(TABLES.employees)
    .select("*")
    .eq(COLS.workspaceId, workspaceId)
    .order("name");

  if (error) {
    return <DatabaseError message={error.message} />;
  }

  return (
    <StaffPageView staff={employees ?? []} workspaceId={workspaceId} />
  );
}
