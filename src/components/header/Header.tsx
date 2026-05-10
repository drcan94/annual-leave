"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  FileDown,
  RotateCcw,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStore, type CalendarView } from "@/stores";
import {
  copyToClipboard,
  downloadCSV,
  generateExportData,
} from "@/utils/export";

const VIEW_OPTIONS: readonly { id: CalendarView; label: string }[] = [
  { id: "yearly", label: "Year" },
  { id: "half-yearly", label: "Half" },
  { id: "monthly", label: "Month" },
  { id: "weekly", label: "Week" },
  { id: "daily", label: "Day" },
] as const;

export function Header() {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const currentYear = useCalendarStore((s) => s.currentYear);
  const setCurrentYear = useCalendarStore((s) => s.setCurrentYear);
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const setFocusedDate = useCalendarStore((s) => s.setFocusedDate);
  const resetAllData = useCalendarStore((s) => s.resetAllData);
  const leaves = useCalendarStore((s) => s.leaves);
  const persons = useCalendarStore((s) => s.persons);

  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [exportOpen]);

  const navLabel = useMemo(() => {
    if (view === "yearly" || view === "half-yearly") {
      return String(currentYear);
    }
    const fd = parseISO(focusedDate);
    if (view === "monthly") {
      return format(fd, "MMMM yyyy");
    }
    if (view === "weekly") {
      const weekStart = startOfWeek(fd, { weekStartsOn: 1 });
      return `Week of ${format(weekStart, "MMMM d, yyyy")}`;
    }
    return format(fd, "EEEE, MMMM d, yyyy");
  }, [view, currentYear, focusedDate]);

  const prevAria =
    view === "yearly" || view === "half-yearly"
      ? "Previous year"
      : view === "monthly"
        ? "Previous month"
        : view === "weekly"
          ? "Previous week"
          : "Previous day";

  const nextAria =
    view === "yearly" || view === "half-yearly"
      ? "Next year"
      : view === "monthly"
        ? "Next month"
        : view === "weekly"
          ? "Next week"
          : "Next day";

  const goPrev = useCallback(() => {
    if (view === "yearly" || view === "half-yearly") {
      setCurrentYear(currentYear - 1);
      return;
    }
    if (view === "monthly") {
      setFocusedDate(format(subMonths(parseISO(focusedDate), 1), "yyyy-MM-dd"));
      return;
    }
    if (view === "weekly") {
      setFocusedDate(format(subWeeks(parseISO(focusedDate), 1), "yyyy-MM-dd"));
      return;
    }
    setFocusedDate(format(subDays(parseISO(focusedDate), 1), "yyyy-MM-dd"));
  }, [view, currentYear, focusedDate, setCurrentYear, setFocusedDate]);

  const goNext = useCallback(() => {
    if (view === "yearly" || view === "half-yearly") {
      setCurrentYear(currentYear + 1);
      return;
    }
    if (view === "monthly") {
      setFocusedDate(format(addMonths(parseISO(focusedDate), 1), "yyyy-MM-dd"));
      return;
    }
    if (view === "weekly") {
      setFocusedDate(format(addWeeks(parseISO(focusedDate), 1), "yyyy-MM-dd"));
      return;
    }
    setFocusedDate(format(addDays(parseISO(focusedDate), 1), "yyyy-MM-dd"));
  }, [view, currentYear, focusedDate, setCurrentYear, setFocusedDate]);

  const onReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Reset all people and leave records? This cannot be undone.",
      )
    ) {
      resetAllData();
    }
  };

  const onDownloadCsv = useCallback(() => {
    const data = generateExportData(leaves, persons);
    if (data.length === 0) {
      window.alert("No leave data to export.");
      return;
    }
    downloadCSV(data);
    setExportOpen(false);
  }, [leaves, persons]);

  const onCopyTsv = useCallback(async () => {
    const data = generateExportData(leaves, persons);
    if (data.length === 0) {
      window.alert("No leave data to copy.");
      return;
    }
    try {
      await copyToClipboard(data);
      window.alert("Table copied to clipboard. Paste into Sheets, Excel, or Notion.");
      setExportOpen(false);
    } catch {
      window.alert("Could not copy to clipboard. Check browser permissions.");
    }
  }, [leaves, persons]);

  return (
    <header className="col-span-2 flex flex-col gap-2 border-b border-zinc-200/80 bg-white/90 px-3 py-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/90 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <span className="hidden text-[11px] font-semibold uppercase tracking-wide sm:inline">
            View
          </span>
        </div>
        <div
          className="inline-flex max-w-full flex-wrap rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
          role="group"
          aria-label="Calendar view"
        >
          {VIEW_OPTIONS.map(({ id, label }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={active}
                className={[
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950",
                  active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-center">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
          aria-label={prevAria}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-48 max-w-[20rem] px-1 text-center sm:min-w-[16rem]">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {navLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
          aria-label={nextAria}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950/80 dark:focus-visible:ring-red-500 dark:focus-visible:ring-offset-zinc-950"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>

        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            aria-expanded={exportOpen}
            aria-haspopup="true"
            className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
          >
            <Download className="size-3.5" aria-hidden />
            Export
            <ChevronDown
              className={[
                "size-3.5 opacity-70 transition-transform",
                exportOpen ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            />
          </button>
          {exportOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-1 min-w-48 rounded-lg border border-zinc-200 bg-white py-0.5 shadow-lg shadow-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <button
                type="button"
                role="menuitem"
                onClick={onDownloadCsv}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
              >
                <FileDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
                Download CSV
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void onCopyTsv()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
              >
                <ClipboardCopy
                  className="size-3.5 shrink-0 opacity-70"
                  aria-hidden
                />
                Copy to Clipboard
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
