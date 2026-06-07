export const dynamic = 'force-dynamic';
import { DatabaseError } from "@/components/DatabaseError";
import { SettingsPageView } from "@/components/views/SettingsPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceDetails,
} from "@/lib/workspace-server";

export default async function SettingsPage() {
  const workspaceId = await ensureWorkspace();
  const workspace = await getWorkspaceDetails(workspaceId);
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(TABLES.branchSettings)
    .select("*")
    .eq(COLS.workspaceId, workspaceId)
    .maybeSingle();

  if (error) {
    return <DatabaseError message={error.message} short />;
  }

  return (
    <SettingsPageView
      settings={(data as BranchSettings) ?? null}
      inviteCode={workspace?.invite_code ?? ""}
      businessName={workspace?.name ?? "ShiftMind"}
      workspaceId={workspaceId}
    />
  );
}
