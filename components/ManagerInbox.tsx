"use client";

import { useTranslation } from "@/components/LanguageProvider";
import Link from "next/link";
import type { InboxItem } from "@/lib/manager-inbox";

export function ManagerInbox({ items }: { items: InboxItem[] }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
        <h2 className="font-semibold text-foreground">{t("inbox.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("inbox.allClear")}</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-default bg-surface p-6 shadow-sm">
      <h2 className="mb-1 font-semibold text-foreground">{t("inbox.title")}</h2>
      <p className="mb-4 text-sm text-muted">{t("inbox.subtitle")}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors hover:bg-subtle ${
                item.priority === "high"
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-default"
              }`}
            >
              <span>{item.message}</span>
              <span className="text-muted">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
