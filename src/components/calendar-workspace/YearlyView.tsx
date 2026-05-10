"use client";

import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function YearlyView() {
  const currentYear = useCalendarStore((s) => s.currentYear);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => (
        <MonthGrid key={month} year={currentYear} month={month} />
      ))}
    </div>
  );
}
