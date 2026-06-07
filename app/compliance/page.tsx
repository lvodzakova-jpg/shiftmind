export const dynamic = "force-dynamic";

import { CompliancePageView } from "@/components/views/CompliancePageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, HrDocument, Shift, Staff } from "@/lib/types";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function CompliancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);

  const supabase = createServerClient();
  const [{ data: staff }, { data: shifts }, { data: documents }, { data: branch }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase
        .from(TABLES.shifts)
        .select("*")
        .gte("date", weekStart)
        .lte("date", weekEnd),
      supabase.from(TABLES.hrDocuments).select("*"),
      supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
    ]);

  return (
    <CompliancePageView
      weekStart={weekStart}
      staff={(staff ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
      documents={(documents ?? []) as HrDocument[]}
      branchSettings={(branch as BranchSettings | null) ?? null}
    />
  );
}
