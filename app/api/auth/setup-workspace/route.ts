import { DEFAULT_BRANCH_SETTINGS } from "@/lib/branch-settings";
import { TABLES } from "@/lib/db";
import { generateInviteCode } from "@/lib/invite-code";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required" },
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

    let inviteCode = generateInviteCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase
        .from(TABLES.workspaces)
        .select("id")
        .eq("invite_code", inviteCode)
        .maybeSingle();
      if (!clash) break;
      inviteCode = generateInviteCode();
    }

    const workspaceId = crypto.randomUUID();

    const { error: wsError } = await supabase.from(TABLES.workspaces).insert({
      id: workspaceId,
      name: businessName,
      invite_code: inviteCode,
      owner_user_id: user.id,
    });

    if (wsError) {
      return NextResponse.json({ error: wsError.message }, { status: 500 });
    }

    const { error: memberError } = await supabase
      .from(TABLES.workspaceMembers)
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    const { error: branchError } = await supabase
      .from(TABLES.branchSettings)
      .insert({
        workspace_id: workspaceId,
        branch_name: businessName,
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

    if (branchError) {
      return NextResponse.json({ error: branchError.message }, { status: 500 });
    }

    return NextResponse.json({
      workspaceId,
      inviteCode,
      businessName,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
