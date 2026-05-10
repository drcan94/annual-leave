"use client";

import { parseISO } from "date-fns";
import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function MonthlyView() {
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const anchor = parseISO(focusedDate);

  return (
    <div className="-mx-4 px-4 md:-mx-0 md:px-0 print:m-0 print:flex print:h-full print:min-h-0 print:w-full print:flex-1 print:flex-col print:overflow-hidden print:p-0">
      <div className="relative mx-auto max-w-6xl print:flex print:h-full print:min-h-0 print:max-w-none print:w-full print:flex-1 print:flex-col">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-zinc-50 via-zinc-50/80 to-transparent print:hidden md:hidden dark:from-zinc-950 dark:via-zinc-950/80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-zinc-50 via-zinc-50/80 to-transparent print:hidden md:hidden dark:from-zinc-950 dark:via-zinc-950/80"
          aria-hidden
        />
        <div className="calendar-h-scroll w-full overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch] print:h-full print:min-h-0 print:flex-1 print:overflow-hidden print:pb-0">
          <div className="min-w-[800px] md:min-w-0 print:flex print:h-full print:min-h-0 print:w-full print:min-w-0">
            <MonthGrid
              year={anchor.getFullYear()}
              month={anchor.getMonth()}
              density="spacious"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
