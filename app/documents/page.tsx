export const dynamic = "force-dynamic";

import { DocumentsPageView } from "@/components/views/DocumentsPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, HrDocument, LegalCountry, Staff } from "@/lib/types";

export default async function DocumentsPage() {
  const supabase = createServerClient();
  const [{ data: staff }, { data: documents }, { data: branch }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase
        .from(TABLES.hrDocuments)
        .select("*")
        .order("uploaded_at", { ascending: false }),
      supabase.from(TABLES.branchSettings).select("legal_country").limit(1).maybeSingle(),
    ]);

  return (
    <DocumentsPageView
      staff={(staff ?? []) as Staff[]}
      documents={(documents ?? []) as HrDocument[]}
      legalCountry={
        ((branch as BranchSettings | null)?.legal_country ?? "sk") as LegalCountry
      }
    />
  );
}
