"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { memo, useMemo, type CSSProperties } from "react";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore } from "@/stores";
import { abbreviationLookup } from "@/utils/names";
import { DayCell } from "./DayCell";

/** Güvenilir bir Pazartesi (haftanın başlıkları için). */
const ROW_ANCHOR_MONDAY = startOfWeek(parseISO("2024-01-08"), {
  weekStartsOn: 1,
});

const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  format(addDays(ROW_ANCHOR_MONDAY, i), "EEE", { locale: dateFnsLocale }),
);

export type MonthGridProps = {
  year: number;
  /** 0-11 */
  month: number;
  density?: "compact" | "spacious";
};

/** Pazartesi tabanlı boş hucre sayısı: Pzt = 0, Paz = 6 */
function leadingEmptySlotCount(monthStart: Date): number {
  return (getDay(monthStart) + 6) % 7;
}

function MonthGridImpl({
  year,
  month,
  density = "compact",
}: MonthGridProps) {
  const persons = useCalendarStore((s) => s.persons);
  const abbrevLookup = useMemo(
    () => abbreviationLookup(persons),
    [persons],
  );
  const monthAnchor = new Date(year, month, 1);
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const daysInMonth = getDaysInMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const pad = leadingEmptySlotCount(monthStart);

  const isSpacious = density === "spacious";
  const weekRowCount = Math.ceil((pad + daysInMonth) / 7);
  const gridGap = isSpacious ? "gap-1" : "gap-x-0.5 gap-y-1";
  const padCellClass = isSpacious
    ? "min-h-[100px] min-w-0 shrink-0 print:min-h-0"
    : "min-h-8 w-full min-w-0 shrink-0 print:min-h-0";

  const localeOpts = { locale: dateFnsLocale };

  const gridStyle = {
    "--month-week-rows": String(weekRowCount),
  } as CSSProperties;

  return (
    <article
      className="calendar-month-root flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-950/5 print:h-full print:min-h-0 print:rounded-lg print:border-zinc-300 print:p-2 print:shadow-none print:ring-0 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none dark:ring-white/10"
      aria-label={`${format(monthStart, "MMMM yyyy", localeOpts)}, ${daysInMonth} gün`}
    >
      <h3 className="shrink-0 border-b border-zinc-100 pb-2 text-sm font-semibold tracking-tight text-zinc-900 print:border-zinc-300 print:pb-1 print:text-[10px] dark:border-zinc-800 dark:text-zinc-50">
        {format(monthStart, "MMMM", localeOpts)}
      </h3>

      <div
        style={gridStyle}
        className={`month-grid-print-rows mt-3 grid min-h-0 flex-1 grid-cols-7 select-none ${gridGap} ${isSpacious ? "auto-rows-fr" : ""} print:mt-1 print:min-h-0 print:flex-1 print:gap-0.5`}
      >
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`wd-${i}`}
            className="flex h-5 items-end justify-center pb-0.5 text-center text-xs font-semibold text-zinc-500 print:h-auto print:min-h-0 print:pb-0 print:text-[8px] print:leading-none dark:text-zinc-400"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: pad }, (_, i) => (
          <div key={`pad-${i}`} className={padCellClass} aria-hidden />
        ))}

        {days.map((day) => (
          <div
            key={format(day, "yyyy-MM-dd")}
            className={
              isSpacious
                ? "flex min-h-[100px] min-w-0 print:h-full print:min-h-0"
                : "flex w-full min-w-0 print:h-full print:min-h-0"
            }
          >
            <DayCell
              date={day}
              density={density}
              abbrevLookup={abbrevLookup}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

export const MonthGrid = memo(MonthGridImpl, (prev, next) =>
  prev.year === next.year &&
  prev.month === next.month &&
  prev.density === next.density,
);

MonthGrid.displayName = "MonthGrid";
