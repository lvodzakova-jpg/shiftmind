export const dynamic = "force-dynamic";

import { TemplatesPageView } from "@/components/views/TemplatesPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { ShiftTemplate, Staff } from "@/lib/types";

export default async function TemplatesPage() {
  const supabase = createServerClient();
  const [{ data: templates }, { data: staff }] = await Promise.all([
    supabase.from(TABLES.shiftTemplates).select("*").order("created_at", { ascending: false }),
    supabase.from(TABLES.employees).select("*").order("name"),
  ]);

  return (
    <TemplatesPageView
      templates={(templates ?? []) as ShiftTemplate[]}
      staff={(staff ?? []) as Staff[]}
    />
  );
}
