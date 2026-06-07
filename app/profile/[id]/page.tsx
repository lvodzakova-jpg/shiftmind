export const dynamic = "force-dynamic";

import { ProfileView } from "@/components/ProfileView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Employee,
  HrDocument,
  LeaveBalance,
  Preference,
  Shift,
} from "@/lib/types";
import { ensureWorkspace } from "@/lib/workspace-server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const workspaceId = await ensureWorkspace();
  const supabase = await createServerClient();

  const [
    { data: employee },
    { data: allStaff },
    { data: documents },
    { data: balances },
    { data: shifts },
    { data: preference },
  ] = await Promise.all([
    supabase
      .from(TABLES.employees)
      .select("*")
      .eq("id", id)
      .eq(COLS.workspaceId, workspaceId)
      .maybeSingle(),
    supabase
      .from(TABLES.employees)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .order("name"),
    supabase.from(TABLES.hrDocuments).select("*").eq(COLS.employeeId, id),
    supabase.from(TABLES.leaveBalances).select("*").eq(COLS.employeeId, id),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .eq(COLS.employeeId, id)
      .order(COLS.shiftDate, { ascending: false })
      .limit(30),
    supabase
      .from(TABLES.preferences)
      .select("*")
      .eq(COLS.employeeId, id)
      .maybeSingle(),
  ]);

  if (!employee) notFound();

  return (
    <div>
      <ProfileView
        employee={employee as Employee}
        allStaff={(allStaff ?? []) as Employee[]}
        documents={(documents ?? []) as HrDocument[]}
        balances={(balances ?? []) as LeaveBalance[]}
        shifts={(shifts ?? []) as Shift[]}
        preference={(preference ?? null) as Preference | null}
      />
    </div>
  );
}
