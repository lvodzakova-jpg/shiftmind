export const dynamic = "force-dynamic";

import { MessagesPageView } from "@/components/views/MessagesPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Message, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";

export default async function MessagesPage() {
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = await createServerClient();
  const [{ data: staff }, { data: messages }] = await Promise.all([
    supabase
      .from(TABLES.employees)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .order("name"),
    employeeIds.length > 0
      ? supabase
          .from(TABLES.messages)
          .select("*")
          .in(COLS.senderId, employeeIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as Message[] }),
  ]);

  return (
    <MessagesPageView
      staff={(staff ?? []) as Staff[]}
      messages={(messages ?? []) as Message[]}
    />
  );
}
