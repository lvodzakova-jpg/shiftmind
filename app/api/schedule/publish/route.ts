import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { ensureWorkspace, getWorkspaceMembership, getAuthenticatedUser } from "@/lib/workspace-server";
import { isManagerRole } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const member = await getWorkspaceMembership(user.id);
    if (!member || !isManagerRole(member.role)) {
      return NextResponse.json({ error: "Managers only" }, { status: 403 });
    }

    const body = await request.json();
    const weekStart =
      typeof body.week_start === "string" ? body.week_start : null;
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return NextResponse.json({ error: "Invalid week_start" }, { status: 400 });
    }

    const workspaceId = await ensureWorkspace();
    const supabase = await createServerClient();

    const { error } = await supabase.from(TABLES.schedulePublications).upsert(
      {
        workspace_id: workspaceId,
        week_start: weekStart,
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,week_start" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: employees } = await supabase
      .from(TABLES.employees)
      .select("id, name")
      .eq(COLS.workspaceId, workspaceId);

    const manager = employees?.find((e) => e.name) ?? employees?.[0];
    if (manager) {
      for (const emp of employees ?? []) {
        await supabase.from(TABLES.messages).insert({
          sender_id: manager.id,
          recipient_id: emp.id,
          content: `Your schedule for week starting ${weekStart} has been published. Open My Schedule to view.`,
          read: false,
        });
      }
    }

    return NextResponse.json({ ok: true, week_start: weekStart });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
