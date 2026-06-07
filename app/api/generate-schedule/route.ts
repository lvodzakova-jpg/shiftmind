import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { COLS, TABLES } from "@/lib/db";
import {
  PREF_DAY_COLUMNS,
  getPreferenceDayValue,
} from "@/lib/preferences";
import { createServerClient } from "@/lib/supabase/server";
import { getShiftDbTimes, isStorableShift } from "@/lib/shifts";
import type { GeneratedSchedule, Preference, ShiftType } from "@/lib/types";
import { BRANCH_DAYS, branchDayCloseKey, branchDayOpenKey } from "@/lib/branch-settings";
import { getDateRange } from "@/lib/leaves";
import type { BranchSettings, LeaveRequest } from "@/lib/types";
import { formatDateISO, getWeekDates, getWeekEnd, getWeekStart } from "@/lib/week";

function extractJson(text: string): GeneratedSchedule {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const parsed = JSON.parse(raw) as {
    week_start: string;
    shifts: Array<{
      employee_id?: string;
      staff_id?: string;
      date?: string;
      shift_date?: string;
      shift_type: ShiftType;
    }>;
  };

  if (!parsed.week_start || !Array.isArray(parsed.shifts)) {
    throw new Error("Neplatný formát odpovede AI");
  }

  return {
    week_start: parsed.week_start,
    shifts: parsed.shifts.map((s) => ({
      employee_id: s.employee_id ?? s.staff_id ?? "",
      date: s.date ?? s.shift_date ?? "",
      shift_type: s.shift_type,
    })),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const weekStart =
      typeof body.week_start === "string"
        ? body.week_start
        : formatDateISO(getWeekStart());

    const supabase = createServerClient();

    const locale =
      typeof body.locale === "string" && ["sk", "en", "es"].includes(body.locale)
        ? body.locale
        : "en";

    const { data: employees, error: employeesError } = await supabase
      .from(TABLES.employees)
      .select("id, name, role, max_hours_per_week, contract_type");

    if (employeesError) {
      return NextResponse.json(
        { error: `Supabase: ${employeesError.message}` },
        { status: 500 }
      );
    }

    if (!employees?.length) {
      return NextResponse.json(
        { error: "Najprv pridajte zamestnancov v sekcii Tím." },
        { status: 400 }
      );
    }

    const { data: preferences, error: prefError } = await supabase
      .from(TABLES.preferences)
      .select(
        "employee_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday"
      );

    if (prefError) {
      return NextResponse.json(
        { error: `Supabase: ${prefError.message}` },
        { status: 500 }
      );
    }

    const weekDates = getWeekDates(weekStart);
    const weekEnd = getWeekEnd(weekStart);
    const dayNames = [
      "Pondelok",
      "Utorok",
      "Streda",
      "Štvrtok",
      "Piatok",
      "Sobota",
      "Nedeľa",
    ];

    const [{ data: branchRow }, { data: leaveRows }] = await Promise.all([
      supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
      supabase
        .from(TABLES.leaveRequests)
        .select("employee_id, type, start_date, end_date, status")
        .eq("status", "approved")
        .lte("start_date", getWeekEnd(weekStart))
        .gte("end_date", weekStart),
    ]);

    const branch = branchRow as BranchSettings | null;
    const minStaff = branch?.min_staff_per_shift ?? 2;
    const weeklyBudget = branch?.weekly_budget ?? 0;

    const openingHours = BRANCH_DAYS.map((day, i) => {
      const open = branch?.[branchDayOpenKey(day)] ?? "07:00";
      const close = branch?.[branchDayCloseKey(day)] ?? "22:00";
      return `${dayNames[i]}: ${open.slice(0, 5)}–${close.slice(0, 5)}`;
    });

    const unavailableByEmployee = new Map<string, string[]>();
    for (const leave of (leaveRows ?? []) as LeaveRequest[]) {
      const dates = getDateRange(leave.start_date, leave.end_date).filter((d) =>
        weekDates.includes(d)
      );
      if (dates.length === 0) continue;
      const existing = unavailableByEmployee.get(leave.employee_id) ?? [];
      unavailableByEmployee.set(leave.employee_id, [
        ...existing,
        ...dates.map((d) => `${d} (${leave.type})`),
      ]);
    }

    const prefList = (preferences ?? []) as Preference[];

    const employeeContext = employees.map((e) => {
      const prefRow = prefList.find((p) => p.employee_id === e.id);
      const prefs = prefRow
        ? PREF_DAY_COLUMNS.map(
            (col, i) =>
              `${dayNames[i]}: ${getPreferenceDayValue(prefRow, i) ?? "off"}`
          )
        : [];
      const approvedLeave = unavailableByEmployee.get(e.id);
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        max_hours_per_week: e.max_hours_per_week,
        contract_type: e.contract_type,
        preferences: prefs.length ? prefs : ["žiadne preferencie"],
        approved_leave_days: approvedLeave?.length
          ? approvedLeave
          : "žiadne",
      };
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chýba ANTHROPIC_API_KEY v .env.local" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const langHint =
      locale === "sk"
        ? "Odpovedaj po slovensky v prípadnom texte, JSON kľúče nechaj v angličtine."
        : locale === "es"
          ? "Responde en español si hay texto, claves JSON en inglés."
          : "Use English for any prose; keep JSON keys in English.";

    const prompt = `You are an expert café shift scheduler. Build an optimal weekly schedule.
${langHint}

Week starts: ${weekStart}
Days: ${weekDates.map((d, i) => `${dayNames[i]} = ${d}`).join(", ")}

Branch opening hours:
${openingHours.join("\n")}

Shift types:
- morning (morning shift, align with opening hours)
- evening (evening shift, align with closing hours)
- full (full day)
- off (day off)
- sick (sick leave only when already in approved_leave_days)

Rules:
1. Each day at least ${minStaff} people on working shifts (morning/evening/full).
2. Respect employee preferences; "unavailable" = no working shift.
3. Never exceed max_hours_per_week per employee (estimate ~8h morning, ~8h evening, ~12h full).
4. approved_leave_days = must be "off" or matching leave type — do NOT assign work.
5. Avoid back-to-back evening then morning for the same person.
6. Assign managers to morning/full shifts on weekdays when possible.
7. Use "sick" only for approved sick leave days; otherwise use "off".
${weeklyBudget > 0 ? `8. Try to stay within weekly labor budget ~€${weeklyBudget}.` : ""}

Employees, preferences, and approved leave:
${JSON.stringify(employeeContext, null, 2)}

Odpovedz VÝHRADNE platným JSON (bez markdown), presne v tomto tvare:
{
  "week_start": "${weekStart}",
  "shifts": [
    { "employee_id": "uuid", "shift_date": "YYYY-MM-DD", "shift_type": "morning|evening|full|off|sick" }
  ]
}

Pre každého zamestnanca a každý deň týždňa musí existovať presne jeden záznam v shifts (${employees.length} × 7 = ${employees.length * 7} záznamov).`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI nevrátila textovú odpoveď" },
        { status: 500 }
      );
    }

    const schedule = extractJson(textBlock.text);
    const employeeIdSet = new Set(employees.map((e) => e.id));
    const validDates = new Set(weekDates);

    const rows = schedule.shifts
      .filter(
        (s) =>
          s.employee_id &&
          employeeIdSet.has(s.employee_id) &&
          validDates.has(s.date) &&
          isStorableShift(s.shift_type)
      )
      .map((s) => {
        const times = getShiftDbTimes(s.shift_type);
        return {
          [COLS.employeeId]: s.employee_id,
          [COLS.shiftDate]: s.date,
          shift_type: s.shift_type,
          [COLS.startTime]: times.start_time,
          [COLS.endTime]: times.end_time,
        };
      });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "AI vygenerovala prázdny alebo neplatný rozvrh" },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabase
      .from(TABLES.shifts)
      .delete()
      .gte(COLS.shiftDate, weekStart)
      .lte(COLS.shiftDate, weekEnd);

    if (deleteError) {
      return NextResponse.json(
        { error: `Mazanie starého rozvrhu: ${deleteError.message}` },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from(TABLES.shifts)
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: `Ukladanie rozvrhu: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      week_start: weekStart,
      shifts_saved: rows.length,
    });
  } catch (e) {
    console.error("generate-schedule:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Interná chyba pri generovaní",
      },
      { status: 500 }
    );
  }
}
