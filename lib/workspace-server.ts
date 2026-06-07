import { DEFAULT_BRANCH_SETTINGS } from "@/lib/branch-settings";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from "@/lib/workspace";
import { cookies, headers } from "next/headers";

export async function resolveWorkspaceId(): Promise<string> {
  const headersList = await headers();
  const fromHeader = headersList.get(WORKSPACE_HEADER);
  if (fromHeader) return fromHeader;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  throw new Error("Missing workspace");
}

/** Ensures workspace + default branch settings exist in the database. */
export async function ensureWorkspace(): Promise<string> {
  const workspaceId = await resolveWorkspaceId();
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from(TABLES.workspaces)
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!existing) {
    await supabase.from(TABLES.workspaces).insert({ id: workspaceId });
    await supabase.from(TABLES.branchSettings).insert({
      workspace_id: workspaceId,
      branch_name: DEFAULT_BRANCH_SETTINGS.branch_name,
      min_staff_per_shift: DEFAULT_BRANCH_SETTINGS.min_staff_per_shift,
      meal_allowance: DEFAULT_BRANCH_SETTINGS.meal_allowance,
      weekly_budget: DEFAULT_BRANCH_SETTINGS.weekly_budget,
      gps_radius_m: DEFAULT_BRANCH_SETTINGS.gps_radius_m,
      legal_country: DEFAULT_BRANCH_SETTINGS.legal_country,
      monday_open: DEFAULT_BRANCH_SETTINGS.monday_open,
      monday_close: DEFAULT_BRANCH_SETTINGS.monday_close,
      tuesday_open: DEFAULT_BRANCH_SETTINGS.tuesday_open,
      tuesday_close: DEFAULT_BRANCH_SETTINGS.tuesday_close,
      wednesday_open: DEFAULT_BRANCH_SETTINGS.wednesday_open,
      wednesday_close: DEFAULT_BRANCH_SETTINGS.wednesday_close,
      thursday_open: DEFAULT_BRANCH_SETTINGS.thursday_open,
      thursday_close: DEFAULT_BRANCH_SETTINGS.thursday_close,
      friday_open: DEFAULT_BRANCH_SETTINGS.friday_open,
      friday_close: DEFAULT_BRANCH_SETTINGS.friday_close,
      saturday_open: DEFAULT_BRANCH_SETTINGS.saturday_open,
      saturday_close: DEFAULT_BRANCH_SETTINGS.saturday_close,
      sunday_open: DEFAULT_BRANCH_SETTINGS.sunday_open,
      sunday_close: DEFAULT_BRANCH_SETTINGS.sunday_close,
    });
  }

  return workspaceId;
}

export async function getWorkspaceEmployeeIds(
  workspaceId: string,
): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from(TABLES.employees)
    .select("id")
    .eq("workspace_id", workspaceId);
  return data?.map((row) => row.id) ?? [];
}
