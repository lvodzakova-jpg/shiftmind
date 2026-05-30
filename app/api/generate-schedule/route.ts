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

    const { data: employees, error: employeesError } = await supabase
      .from(TABLES.employees)
      .select("id, name, role");

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

    const prefList = (preferences ?? []) as Preference[];

    const employeeContext = employees.map((e) => {
      const prefRow = prefList.find((p) => p.employee_id === e.id);
      const prefs = prefRow
        ? PREF_DAY_COLUMNS.map(
            (col, i) =>
              `${dayNames[i]}: ${getPreferenceDayValue(prefRow, i) ?? "off"}`
          )
        : [];
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        preferences: prefs.length ? prefs : ["žiadne preferencie"],
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

    const prompt = `Si expert na plánovanie zmien v kaviarni. Vytvor optimálny týždenný rozvrh.

Týždeň začína: ${weekStart}
Dni v poradí: ${weekDates.map((d, i) => `${dayNames[i]} = ${d}`).join(", ")}

Typy zmien:
- morning (ranná 7:00-15:00)
- evening (večerná 14:00-22:00)
- full (celá 7:00-19:00)
- off (voľno)
- sick (PN, len ak je to nutné)

Pravidlá:
1. Každý deň musia pracovať aspoň 2 ľudia (morning/evening/full).
2. Rešpektuj preferencie zamestnancov; "unavailable" = nepriraď pracovnú zmenu.
3. Rozdeľ zmeny férovo — max 5 pracovných dní na osobu.
4. Po sebe nasledujúce večerná + ranná zmena u tej istej osoby sa vyhýbaj.
5. Manažéra priraď skôr na ranné/celé zmeny v pracovných dňoch.
6. PN (sick) používaj len výnimočne, max 1 deň na týždeň celkovo.

Zamestnanci a preferencie:
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
