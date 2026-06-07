"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { COLS, TABLES } from "@/lib/db";
import { getShiftDbTimes } from "@/lib/shifts";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ShiftType } from "@/lib/types";
import { ShiftBadge } from "@/components/ShiftBadge";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SHIFT_TYPES: ShiftType[] = [
  "morning",
  "evening",
  "full",
  "off",
  "sick",
];

interface ShiftEditCellProps {
  employeeId: string;
  date: string;
  shiftType: ShiftType;
  hasViolation?: boolean;
}

export function ShiftEditCell({
  employeeId,
  date,
  shiftType,
  hasViolation,
}: ShiftEditCellProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(shiftType);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    setCurrent(shiftType);
  }, [shiftType]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function selectType(next: ShiftType) {
    if (next === current) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const times = getShiftDbTimes(next);
    const supabase = createBrowserClient();
    const { error } = await supabase.from(TABLES.shifts).upsert(
      {
        [COLS.employeeId]: employeeId,
        [COLS.shiftDate]: date,
        shift_type: next,
        [COLS.startTime]: times.start_time,
        [COLS.endTime]: times.end_time,
      },
      { onConflict: "employee_id,date" }
    );
    setSaving(false);
    if (!error) {
      setCurrent(next);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <td
      ref={ref}
      className={`relative px-2 py-2 text-center ${
        hasViolation ? "bg-rose-100 ring-1 ring-rose-300" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="group mx-auto flex flex-col items-center gap-0.5 rounded-lg p-1 transition-colors hover:bg-subtle disabled:opacity-50"
        title={t("schedule.clickToEdit")}
        aria-label={t("schedule.clickToEdit")}
        aria-expanded={open}
      >
        <ShiftBadge type={current} compact />
        <span className="text-[9px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
          {saving ? "…" : "✎"}
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-1 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-default bg-surface p-2 shadow-lg">
          {SHIFT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => selectType(type)}
              className={`rounded-lg px-2 py-1 transition-colors hover:bg-subtle ${
                type === current ? "ring-2 ring-brand" : ""
              }`}
            >
              <ShiftBadge type={type} compact />
            </button>
          ))}
        </div>
      )}
    </td>
  );
}
