export const dynamic = "force-dynamic";

import { MessagesPageView } from "@/components/views/MessagesPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Message, Staff } from "@/lib/types";

export default async function MessagesPage() {
  const supabase = createServerClient();
  const [{ data: staff }, { data: messages }] = await Promise.all([
    supabase.from(TABLES.employees).select("*").order("name"),
    supabase
      .from(TABLES.messages)
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <MessagesPageView
      staff={(staff ?? []) as Staff[]}
      messages={(messages ?? []) as Message[]}
    />
  );
}
