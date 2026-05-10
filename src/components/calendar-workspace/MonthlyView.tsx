"use client";

import { parseISO } from "date-fns";
import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function MonthlyView() {
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const anchor = parseISO(focusedDate);

  return (
    <div className="-mx-4 px-4 md:-mx-0 md:px-0">
      <div className="mx-auto max-w-6xl overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="min-w-[800px] md:min-w-0">
          <MonthGrid
            year={anchor.getFullYear()}
            month={anchor.getMonth()}
            density="spacious"
          />
        </div>
      </div>
    </div>
  );
}
