"use client";

import { useState } from "react";
import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function HalfYearlyView() {
  const currentYear = useCalendarStore((s) => s.currentYear);
  const [half, setHalf] = useState<"first" | "second">("first");

  const months = half === "first" ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];

  const pill =
    "rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div
        className="inline-flex w-fit flex-wrap gap-0.5 rounded-lg border border-zinc-200/90 bg-zinc-50/90 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80"
        role="group"
        aria-label="Yarıyıl dönemi"
      >
        <button
          type="button"
          aria-pressed={half === "first"}
          onClick={() => setHalf("first")}
          className={[
            pill,
            half === "first"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          ].join(" ")}
        >
          İlk yarı (Oca–Haz)
        </button>
        <button
          type="button"
          aria-pressed={half === "second"}
          onClick={() => setHalf("second")}
          className={[
            pill,
            half === "second"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          ].join(" ")}
        >
          İkinci yarı (Tem–Ara)
        </button>
      </div>

      <div className="-mx-4 px-4 md:-mx-0 md:px-0">
        <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <div className="grid min-w-[800px] grid-cols-1 gap-6 md:min-w-0 md:grid-cols-2 xl:grid-cols-3">
            {months.map((month) => (
              <MonthGrid key={month} year={currentYear} month={month} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
