"use client";

import { parseISO } from "date-fns";
import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function MonthlyView() {
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const anchor = parseISO(focusedDate);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <MonthGrid
        year={anchor.getFullYear()}
        month={anchor.getMonth()}
        density="spacious"
      />
    </div>
  );
}
