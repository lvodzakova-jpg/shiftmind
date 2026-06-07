import { TABLES } from "@/lib/db";
import { normalizeInviteCode } from "@/lib/invite-code";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inviteCode = normalizeInviteCode(
      typeof body.inviteCode === "string" ? body.inviteCode : "",
    );

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from(TABLES.workspaceMembers)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already belong to a team" },
        { status: 409 },
      );
    }

    const { data: workspace, error: wsError } = await supabase
      .from(TABLES.workspaces)
      .select("id, name, invite_code")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (wsError) {
      return NextResponse.json({ error: wsError.message }, { status: 500 });
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 },
      );
    }

    const { error: memberError } = await supabase
      .from(TABLES.workspaceMembers)
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({
      workspaceId: workspace.id,
      businessName: workspace.name,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
