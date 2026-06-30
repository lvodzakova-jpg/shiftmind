import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { COLS, TABLES } from "@/lib/db";
import {
  PREF_DAY_COLUMNS,
  getPreferenceDayValue,
} from "@/lib/preferences";
import { createServerClient } from "@/lib/supabase/server";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { getShiftDbTimes, isStorableShift } from "@/lib/shifts";
import type { GeneratedSchedule, Preference, ShiftType } from "@/lib/types";
import { BRANCH_DAYS, branchDayCloseKey, branchDayOpenKey } from "@/lib/branch-settings";
import { getDateRange } from "@/lib/leaves";
import type { BranchSettings, LeaveRequest } from "@/lib/types";
import { formatDateISO, getWeekDates, getWeekEnd, getWeekStart } from "@/lib/week";

function extractJson(text: string): GeneratedSchedule & {
  explanation?: string[];
} {
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
    explanation?: string[];
  };

  if (!parsed.week_start || !Array.isArray(parsed.shifts)) {
    throw new Error("Invalid AI response format");
  }

  return {
    week_start: parsed.week_start,
    shifts: parsed.shifts.map((s) => ({
      employee_id: s.employee_id ?? s.staff_id ?? "",
      date: s.date ?? s.shift_date ?? "",
      shift_type: s.shift_type,
    })),
    explanation: parsed.explanation,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const weekStart =
      typeof body.week_start === "string"
        ? body.week_start
        : formatDateISO(getWeekStart());

    const workspaceId = await ensureWorkspace();
    const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
    const supabase = await createServerClient();

    const locale =
      typeof body.locale === "string" && ["sk", "en", "es"].includes(body.locale)
        ? body.locale
        : "en";

    const { data: employees, error: employeesError } = await supabase
      .from(TABLES.employees)
      .select("id, name, role, max_hours_per_week, contract_type")
      .eq(COLS.workspaceId, workspaceId);

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

    const { data: preferences, error: prefError } =
      employeeIds.length > 0
        ? await supabase
            .from(TABLES.preferences)
            .select(
              "employee_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday",
            )
            .in(COLS.employeeId, employeeIds)
        : { data: [], error: null };

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
      supabase
        .from(TABLES.branchSettings)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .maybeSingle(),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.leaveRequests)
            .select("employee_id, type, start_date, end_date, status")
            .in(COLS.employeeId, employeeIds)
            .eq("status", "approved")
            .lte("start_date", getWeekEnd(weekStart))
            .gte("end_date", weekStart)
        : Promise.resolve({ data: [] }),
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

    const prompt = `You are an expert workplace shift scheduler. Build an optimal weekly schedule for a retail/hospitality team.

Week starts: ${weekStart}
Days: ${weekDates.map((d, i) => `${dayNames[i]} = ${d}`).join(", ")}

Opening hours:
${openingHours.join("\n")}

Shift types: morning, evening, full, off, sick

Rules:
1. Each day at least ${minStaff} people on working shifts (morning/evening/full).
2. Respect employee preferences; "unavailable" = no working shift.
3. Never exceed max_hours_per_week per employee (~8h morning, ~8h evening, ~12h full).
4. approved_leave_days = must be off or matching leave — no work shifts.
5. Avoid evening-then-morning back-to-back for the same person.
6. Prefer managers on morning/full shifts on weekdays.
7. Use "sick" only for approved sick leave days.
${weeklyBudget > 0 ? `8. Stay near weekly labor budget ~${weeklyBudget}.` : ""}

Team data:
${JSON.stringify(employeeContext, null, 2)}

Respond with ONLY valid JSON (no markdown):
{
  "week_start": "${weekStart}",
  "shifts": [
    { "employee_id": "uuid", "shift_date": "YYYY-MM-DD", "shift_type": "morning|evening|full|off|sick" }
  ],
  "explanation": [
    "Short bullet: key scheduling decision in plain English",
    "Another bullet if needed"
  ]
}

Exactly one shift per employee per day (${employees.length} × 7 = ${employees.length * 7} rows).`;

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
    const explanationText =
      schedule.explanation?.join("\n") ?? null;
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

    const { error: deleteError } =
      employeeIds.length > 0
        ? await supabase
            .from(TABLES.shifts)
            .delete()
            .in(COLS.employeeId, employeeIds)
            .gte(COLS.shiftDate, weekStart)
            .lte(COLS.shiftDate, weekEnd)
        : { error: null };

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
        { error: `Saving schedule: ${insertError.message}` },
        { status: 500 }
      );
    }

    await supabase.from(TABLES.schedulePublications).upsert(
      {
        workspace_id: workspaceId,
        week_start: weekStart,
        status: "draft",
        ai_explanation: explanationText,
        published_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,week_start" },
    );

    return NextResponse.json({
      success: true,
      week_start: weekStart,
      shifts_saved: rows.length,
      explanation: explanationText,
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
