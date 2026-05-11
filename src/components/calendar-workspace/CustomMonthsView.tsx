"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

const MONTH_TOGGLE_BASE =
  "rounded-md px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors min-w-[2.25rem] sm:min-w-0";

export function CustomMonthsView() {
  const currentYear = useCalendarStore((s) => s.currentYear);
  const selectedMonths = useCalendarStore((s) => s.selectedMonths);
  const toggleSelectedMonth = useCalendarStore((s) => s.toggleSelectedMonth);
  const selectAllMonths = useCalendarStore((s) => s.selectAllMonths);
  const clearSelectedMonths = useCalendarStore((s) => s.clearSelectedMonths);

  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, mi) =>
        format(new Date(2024, mi, 1), "MMM", { locale: dateFnsLocale }),
      ),
    [],
  );

  const sortedMonths = useMemo(
    () => [...selectedMonths].sort((a, b) => a - b),
    [selectedMonths],
  );

  const selectedSet = useMemo(() => new Set(selectedMonths), [selectedMonths]);

  const printMonthTileGridClass =
    sortedMonths.length <= 6
      ? "print:grid print:grid-cols-3 print:grid-rows-2 print:gap-1 print:h-full print:min-h-0 print:min-w-0 print:overflow-hidden print:content-stretch"
      : "print:grid print:grid-cols-4 print:grid-rows-3 print:gap-1 print:h-full print:min-h-0 print:min-w-0 print:overflow-hidden print:content-stretch";

  return (
    <div className="flex min-h-0 flex-col gap-3 print:h-full print:min-h-0 print:flex-1 print:gap-0 print:overflow-hidden">
      <div
        className="flex flex-col gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50/90 p-2 print:hidden dark:border-zinc-700 dark:bg-zinc-900/80"
        role="group"
        aria-label="Gösterilecek aylar"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex flex-wrap gap-0.5">
            {monthLabels.map((label, mi) => {
              const sel = selectedSet.has(mi);
              return (
                <button
                  key={mi}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => toggleSelectedMonth(mi)}
                  className={[
                    MONTH_TOGGLE_BASE,
                    sel
                      ? "border border-zinc-300 bg-white text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                      : "border border-transparent text-zinc-500 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto inline-flex shrink-0 flex-wrap gap-0.5 print:ml-0">
            <button
              type="button"
              onClick={selectAllMonths}
              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Tümünü Seç
            </button>
            <button
              type="button"
              onClick={clearSelectedMonths}
              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      <div className="-mx-4 px-4 md:-mx-0 md:px-0 print:m-0 print:flex print:min-h-0 print:flex-1 print:flex-col print:overflow-hidden print:p-0">
        {sortedMonths.length === 0 ? (
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
            Görüntülemek için en az bir ay seçin.
          </p>
        ) : (
          <div className="calendar-h-scroll w-full overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch] webkit-overflow-scrolling-touch print:h-full print:min-h-0 print:flex-1 print:overflow-hidden print:pb-0">
            <div
              className={`custom-month-grid grid min-w-[800px] grid-cols-1 gap-6 sm:grid-cols-2 md:min-w-0 lg:grid-cols-3 2xl:grid-cols-4 ${printMonthTileGridClass}`}
            >
              {sortedMonths.map((month) => (
                <MonthGrid key={month} year={currentYear} month={month} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
