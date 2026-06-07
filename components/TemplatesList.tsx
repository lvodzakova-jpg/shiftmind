"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { ShiftBadge } from "@/components/ShiftBadge";
import { TABLES } from "@/lib/db";
import { createBrowserClient } from "@/lib/supabase/client";
import { buildShiftRows, getDatesForRecurrence } from "@/lib/recurring";
import type { RecurrenceType, ShiftTemplate, ShiftType, Staff } from "@/lib/types";
import { formatDateISO, getWeekEnd } from "@/lib/week";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TemplatesListProps {
  templates: ShiftTemplate[];
  staff: Staff[];
}

const RECURRENCES: RecurrenceType[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "last_weekday",
];

const SHIFT_TYPES: ShiftType[] = ["morning", "evening", "full"];

export function TemplatesList({ templates: initial, staff }: TemplatesListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [name, setName] = useState("");
  const [shiftType, setShiftType] = useState<ShiftType>("morning");
  const [employeeId, setEmployeeId] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("weekly");
  const [weekday, setWeekday] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const { data, error: insertError } = await supabase
      .from(TABLES.shiftTemplates)
      .insert({
        name: name.trim(),
        shift_type: shiftType,
        employee_id: employeeId || null,
        recurrence,
        weekday,
      })
      .select()
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setTemplates((prev) => [...prev, data as ShiftTemplate]);
      setName("");
      router.refresh();
    }
  }

  async function handleDelete(id: string, templateName: string) {
    if (!confirm(t("templates.deleteConfirm", { name: templateName }))) return;
    const supabase = createBrowserClient();
    await supabase.from(TABLES.shiftTemplates).delete().eq("id", id);
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
    router.refresh();
  }

  async function handleApply(template: ShiftTemplate) {
    if (!template.employee_id) return;
    const weekStart = formatDateISO(new Date());
    const end = getWeekEnd(weekStart);
    const dates = getDatesForRecurrence(
      template.recurrence,
      weekStart,
      end,
      template.weekday
    );
    const rows = buildShiftRows(
      template.employee_id,
      template.shift_type,
      dates
    );
    const supabase = createBrowserClient();
    await supabase.from(TABLES.shifts).upsert(rows, {
      onConflict: "employee_id,date",
    });
    router.push("/schedule");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">{t("templates.add")}</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("templates.name")}
            className="w-full rounded-lg border border-default px-3 py-2"
            required
          />
          <select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value as ShiftType)}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {SHIFT_TYPES.map((st) => (
              <option key={st} value={st}>
                {t(`shifts.${st}`)}
              </option>
            ))}
          </select>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            <option value="">{t("templates.employee")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {t(`templates.recurrences.${r}`)}
              </option>
            ))}
          </select>
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {t("templates.weekday")} {d}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? t("common.saving") : t("templates.add")}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-muted">{t("templates.empty")}</p>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between rounded-xl border border-default bg-surface p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-foreground">{tpl.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <ShiftBadge type={tpl.shift_type} compact />
                  <span className="text-xs text-muted">
                    {t(`templates.recurrences.${tpl.recurrence}`)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {tpl.employee_id && (
                  <button
                    type="button"
                    onClick={() => handleApply(tpl)}
                    className="rounded-lg bg-subtle px-3 py-1.5 text-xs font-medium text-brand hover:bg-subtle"
                  >
                    {t("templates.apply")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(tpl.id, tpl.name)}
                  className="rounded-lg px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  {t("common.remove")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
