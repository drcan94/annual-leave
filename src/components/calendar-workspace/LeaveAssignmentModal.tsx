"use client";

import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useId, useState } from "react";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore } from "@/stores";

function formatIsoReadable(iso: string): string {
  return format(parseISO(iso), "d MMMM yyyy", { locale: dateFnsLocale });
}

export function LeaveAssignmentModal() {
  const assignmentModal = useCalendarStore((s) => s.assignmentModal);
  const persons = useCalendarStore((s) => s.persons);
  const addLeave = useCalendarStore((s) => s.addLeave);
  const closeModal = useCalendarStore((s) => s.closeModal);

  const headingId = useId();
  const [personId, setPersonId] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isOpen, defaultPersonId, defaultStart, defaultEnd } = assignmentModal;

  useEffect(() => {
    if (!isOpen) return;
    const nextEnd = defaultEnd ?? "";
    setEndDate(nextEnd);
    const preferred =
      (defaultPersonId && persons.some((p) => p.id === defaultPersonId)
        ? defaultPersonId
        : undefined) ?? persons[0]?.id ?? "";
    setPersonId(preferred);
  }, [isOpen, defaultPersonId, defaultEnd, persons]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeModal]);

  const onSave = useCallback(() => {
    if (!defaultStart) {
      window.alert("Başlangıç tarihi eksik.");
      return;
    }
    if (!personId) {
      window.alert("Bir kişi seçin.");
      return;
    }
    if (!endDate || endDate < defaultStart) {
      window.alert("Bitiş tarihi başlangıç tarihiyle aynı veya daha sonra olmalıdır.");
      return;
    }
    try {
      addLeave(personId, defaultStart, endDate);
      closeModal();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "İzin kaydedilemedi. Tekrar deneyin.";
      window.alert(msg);
    }
  }, [addLeave, closeModal, defaultStart, endDate, personId]);

  const onCancel = useCallback(() => {
    closeModal();
  }, [closeModal]);

  if (!isOpen || !defaultStart) {
    return null;
  }

  const readableStart = formatIsoReadable(defaultStart);
  const canSave = persons.length > 0 && Boolean(personId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Pencereyi kapat"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40 dark:bg-black/60 dark:focus-visible:ring-white/30"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl shadow-zinc-950/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <h2
          id={headingId}
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          İzin ata
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Kişiyi ve bu aralık için bitiş tarihini onaylayın.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Başlangıç tarihi
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {readableStart}
            </p>
          </div>

          <div>
            <label
              htmlFor="leave-end-date"
              className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Bitiş tarihi
            </label>
            <input
              id="leave-end-date"
              type="date"
              value={endDate}
              min={defaultStart}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus-visible:ring-zinc-500/40"
            />
          </div>

          <div>
            <label
              htmlFor="leave-person"
              className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Kişi
            </label>
            {persons.length === 0 ? (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                İzin atamadan önce kenar çubuğundan bir kişi ekleyin.
              </p>
            ) : (
              <select
                id="leave-person"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus-visible:ring-zinc-500/40"
              >
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={onSave}
            className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
