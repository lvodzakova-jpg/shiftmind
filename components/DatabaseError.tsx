"use client";

import { useTranslation } from "@/components/LanguageProvider";

interface DatabaseErrorProps {
  message: string;
  short?: boolean;
}

export function DatabaseError({ message, short = false }: DatabaseErrorProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <p className="font-semibold">{t("db.errorTitle")}</p>
      <p className="mt-2 text-sm">{message}</p>
      <p className="mt-4 text-sm">
        {short ? t("db.runSchemaShort") : t("db.runSchema")}
        {!short && (
          <>
            {" "}
            <code className="rounded bg-rose-100 px-1">supabase/schema.sql</code>
          </>
        )}
      </p>
    </div>
  );
}
