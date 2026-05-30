"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { SHIFT_STYLES, SHIFT_TIMES } from "@/lib/shifts";
import type { ShiftType } from "@/lib/types";

interface ShiftBadgeProps {
  type: ShiftType;
  compact?: boolean;
}

export function ShiftBadge({ type, compact = false }: ShiftBadgeProps) {
  const { t } = useTranslation();
  const style = SHIFT_STYLES[type];
  const label = t(`shifts.${type}`);

  return (
    <span
      className={`inline-flex flex-col items-center rounded-lg border px-2 py-1 text-center ${style.bg} ${style.text} ${style.border} ${compact ? "text-xs" : "text-sm"}`}
    >
      <span className="font-semibold">{label}</span>
      {!compact && type !== "off" && type !== "sick" && (
        <span className="text-[10px] opacity-75">{SHIFT_TIMES[type]}</span>
      )}
    </span>
  );
}
