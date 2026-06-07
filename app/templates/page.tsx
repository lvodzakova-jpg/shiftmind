export const dynamic = "force-dynamic";

import { TemplatesPageView } from "@/components/views/TemplatesPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { ShiftTemplate, Staff } from "@/lib/types";
import { ensureWorkspace } from "@/lib/workspace-server";

export default async function TemplatesPage() {
  const workspaceId = await ensureWorkspace();
  const supabase = await createServerClient();
  const [{ data: templates }, { data: staff }] = await Promise.all([
    supabase
      .from(TABLES.shiftTemplates)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from(TABLES.employees)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .order("name"),
  ]);

  return (
    <TemplatesPageView
      templates={(templates ?? []) as ShiftTemplate[]}
      staff={(staff ?? []) as Staff[]}
      workspaceId={workspaceId}
    />
  );
}
