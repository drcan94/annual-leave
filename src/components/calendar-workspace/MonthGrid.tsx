"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";
import { DayCell } from "./DayCell";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export type MonthGridProps = {
  year: number;
  /** 0-11 */
  month: number;
  density?: "compact" | "spacious";
};

/** Monday-based index in the first row: Mon = 0, Sun = 6 */
function leadingEmptySlotCount(monthStart: Date): number {
  return (getDay(monthStart) + 6) % 7;
}

export function MonthGrid({
  year,
  month,
  density = "compact",
}: MonthGridProps) {
  const monthAnchor = new Date(year, month, 1);
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const daysInMonth = getDaysInMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const pad = leadingEmptySlotCount(monthStart);

  const isSpacious = density === "spacious";
  const gridGap = isSpacious ? "gap-1" : "gap-x-0.5 gap-y-1";
  const padCellClass = isSpacious
    ? "min-h-[100px] min-w-0 shrink-0"
    : "size-8 shrink-0";

  return (
    <article
      className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none dark:ring-white/10"
      aria-label={`${format(monthStart, "MMMM")} ${year}, ${daysInMonth} days`}
    >
      <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold tracking-tight text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        {format(monthStart, "MMMM")}
      </h3>

      <div
        className={`mt-3 grid grid-cols-7 select-none ${gridGap} ${isSpacious ? "auto-rows-fr" : ""}`}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex h-5 items-end justify-center pb-0.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400"
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
                ? "flex min-h-[100px] min-w-0"
                : "flex justify-center"
            }
          >
            <DayCell date={day} density={density} />
          </div>
        ))}
      </div>
    </article>
  );
}
