import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      employeeId?: string;
      subscription?: PushSubscriptionJSON;
    };

    if (!body.subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { error } = await supabase.from(TABLES.pushSubscriptions).upsert(
      {
        employee_id: body.employeeId ?? null,
        endpoint: body.subscription.endpoint,
        subscription: body.subscription,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
