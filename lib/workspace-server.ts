import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getWorkspaceMembership(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(TABLES.workspaceMembers)
    .select("workspace_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Returns workspace id for the logged-in user. */
export async function ensureWorkspace(): Promise<string> {
  const { user } = await getAuthenticatedUser();
  if (!user) throw new Error("Not authenticated");

  const member = await getWorkspaceMembership(user.id);
  if (!member) throw new Error("No workspace — join or create a team first");

  return member.workspace_id;
}

export async function getWorkspaceEmployeeIds(
  workspaceId: string,
): Promise<string[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from(TABLES.employees)
    .select("id")
    .eq("workspace_id", workspaceId);
  return data?.map((row) => row.id) ?? [];
}

export async function getWorkspaceDetails(workspaceId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(TABLES.workspaces)
    .select("id, name, invite_code")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
