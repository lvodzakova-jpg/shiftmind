"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { ShiftBadge } from "@/components/ShiftBadge";
import { TABLES } from "@/lib/db";
import { getCurrentEmployeeId } from "@/lib/current-user";
import {
  applyApprovedSwap,
  getUpcomingShiftsForEmployee,
} from "@/lib/shift-swaps";
import { showLocalNotification } from "@/lib/push-client";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Shift, ShiftSwapRequest, Staff } from "@/lib/types";
import { formatDateISO } from "@/lib/week";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ShiftSwapPanelProps {
  staff: Staff[];
  shifts: Shift[];
  requests: ShiftSwapRequest[];
}

export function ShiftSwapPanel({ staff, shifts, requests: initial }: ShiftSwapPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [currentId, setCurrentId] = useState(staff[0]?.id ?? "");
  const [shiftId, setShiftId] = useState("");
  const [coverId, setCoverId] = useState("");
  const [exchangeId, setExchangeId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = formatDateISO(new Date());

  useEffect(() => {
    setCurrentId(getCurrentEmployeeId() ?? staff[0]?.id ?? "");
  }, [staff]);

  const myShifts = useMemo(
    () => getUpcomingShiftsForEmployee(currentId, shifts, today),
    [currentId, shifts, today]
  );

  const shiftLabel = (s: Shift) =>
    t("swaps.shiftLabel", {
      date: s.date,
      type: t(`shifts.${s.shift_type}`),
      time: `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`,
    });

  const empName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentId || !shiftId) return;
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const { data, error: insertError } = await supabase
      .from(TABLES.shiftSwapRequests)
      .insert({
        requester_id: currentId,
        shift_id: shiftId,
        cover_employee_id: coverId || null,
        exchange_shift_id: exchangeId || null,
        status: "pending",
        note: note.trim() || null,
      })
      .select()
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setRequests((prev) => [data as ShiftSwapRequest, ...prev]);
      setNote("");
      setShiftId("");
      setCoverId("");
      setExchangeId("");
      router.refresh();
    }
  }

  async function handleVolunteer(requestId: string, volunteerId: string) {
    const supabase = createBrowserClient();
    const { error: updateError } = await supabase
      .from(TABLES.shiftSwapRequests)
      .update({ cover_employee_id: volunteerId })
      .eq("id", requestId);
    if (!updateError) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, cover_employee_id: volunteerId } : r
        )
      );
      router.refresh();
    }
  }

  async function handleStatus(id: string, status: "approved" | "rejected") {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const supabase = createBrowserClient();

    if (status === "approved") {
      try {
        await applyApprovedSwap(supabase, req, shifts);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("common.unknownError"));
        return;
      }
      showLocalNotification(t("swaps.title"), t(`swaps.${status}`));
    }

    const { error: updateError } = await supabase
      .from(TABLES.shiftSwapRequests)
      .update({ status })
      .eq("id", id);

    if (!updateError) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      router.refresh();
    }
  }

  const otherShifts = shifts.filter(
    (s) =>
      s.employee_id !== currentId &&
      s.date >= today &&
      s.shift_type !== "off" &&
      s.shift_type !== "sick"
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">{t("swaps.newRequest")}</h2>
        <div className="space-y-3">
          <select
            value={currentId}
            onChange={(e) => {
              setCurrentId(e.target.value);
              setShiftId("");
            }}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("swaps.myShift")}</label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
              required
            >
              <option value="">{t("swaps.myShift")}…</option>
              {myShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {shiftLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("swaps.coverBy")}</label>
            <select
              value={coverId}
              onChange={(e) => setCoverId(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            >
              <option value="">{t("swaps.none")}</option>
              {staff
                .filter((s) => s.id !== currentId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("swaps.exchangeWith")}</label>
            <select
              value={exchangeId}
              onChange={(e) => setExchangeId(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            >
              <option value="">—</option>
              {otherShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {empName(s.employee_id)} · {shiftLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("swaps.note")}
            className="w-full rounded-lg border border-default px-3 py-2"
            rows={2}
          />
          <button
            type="submit"
            disabled={loading || myShifts.length === 0}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("swaps.submit")}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-muted">{t("swaps.empty")}</p>
        ) : (
          requests.map((req) => {
            const shift = shifts.find((s) => s.id === req.shift_id);
            const exchange = req.exchange_shift_id
              ? shifts.find((s) => s.id === req.exchange_shift_id)
              : null;
            return (
              <div
                key={req.id}
                className="rounded-xl border border-default bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{empName(req.requester_id)}</p>
                    {shift && (
                      <p className="mt-1 text-sm">
                        <ShiftBadge type={shift.shift_type} compact />{" "}
                        {shiftLabel(shift)}
                      </p>
                    )}
                    {req.cover_employee_id && (
                      <p className="text-sm text-muted">
                        {t("swaps.coverBy")}: {empName(req.cover_employee_id)}
                      </p>
                    )}
                    {exchange && (
                      <p className="text-sm text-muted">
                        {t("swaps.exchangeWith")}: {shiftLabel(exchange)}
                      </p>
                    )}
                    {req.note && (
                      <p className="mt-1 text-sm text-muted">{req.note}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      req.status === "approved"
                        ? "bg-subtle text-brand"
                        : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {t(`swaps.${req.status}`)}
                  </span>
                </div>
                {req.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!req.cover_employee_id && currentId && currentId !== req.requester_id && (
                      <button
                        type="button"
                        onClick={() => handleVolunteer(req.id, currentId)}
                        className="rounded-lg border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-subtle"
                      >
                        {t("swaps.volunteer")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatus(req.id, "approved")}
                      disabled={!req.cover_employee_id && !req.exchange_shift_id}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-on-brand hover:bg-brand-hover disabled:opacity-40"
                    >
                      {t("swaps.approve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatus(req.id, "rejected")}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      {t("swaps.reject")}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
