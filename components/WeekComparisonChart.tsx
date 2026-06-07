"use client";

import { useTranslation } from "@/components/LanguageProvider";
import type { WeekComparison } from "@/lib/kpi";
import { formatMaxHours } from "@/lib/hours";

interface WeekComparisonChartProps {
  data: WeekComparison[];
}

export function WeekComparisonChart({ data }: WeekComparisonChartProps) {
  const { t } = useTranslation();
  const maxScheduled = Math.max(...data.map((d) => d.scheduledHours), 1);
  const maxActual = Math.max(...data.map((d) => d.actualHours), 1);
  const maxVal = Math.max(maxScheduled, maxActual);

  const labels: Record<string, string> = {
    prev: t("dashboard.prevWeek"),
    current: t("dashboard.currentWeek"),
  };

  return (
    <div className="space-y-4">
      {data.map((week) => (
        <div key={week.label}>
          <div className="mb-1 text-xs font-medium text-muted">
            {labels[week.label] ?? week.label}
          </div>
          <div className="space-y-2">
            <BarRow
              label={t("dashboard.scheduledHours")}
              value={week.scheduledHours}
              max={maxVal}
              color="bg-brand"
            />
            <BarRow
              label={t("dashboard.actualHours")}
              value={week.actualHours}
              max={maxVal}
              color="bg-accent"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            €{week.laborCost.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-medium text-foreground">
        {formatMaxHours(value)}h
      </span>
    </div>
  );
}
