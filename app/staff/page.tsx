import { DatabaseError } from "@/components/DatabaseError";
import { StaffPageView } from "@/components/views/StaffPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";

export default async function StaffPage() {
  const supabase = createServerClient();
  const { data: employees, error } = await supabase
    .from(TABLES.employees)
    .select("*")
    .order("name");

  if (error) {
    return <DatabaseError message={error.message} />;
  }

  return <StaffPageView staff={employees ?? []} />;
}
