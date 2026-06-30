import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { SchedulePublication } from "@/lib/types";

export async function getSchedulePublication(
  workspaceId: string,
  weekStart: string,
): Promise<SchedulePublication | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from(TABLES.schedulePublications)
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("week_start", weekStart)
    .maybeSingle();
  return (data as SchedulePublication) ?? null;
}

export async function isWeekPublishedForStaff(
  workspaceId: string,
  weekStart: string,
  isManager: boolean,
): Promise<boolean> {
  if (isManager) return true;
  const pub = await getSchedulePublication(workspaceId, weekStart);
  return pub?.status === "published";
}
