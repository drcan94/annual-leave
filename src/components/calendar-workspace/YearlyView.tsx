"use client";

import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function YearlyView() {
  const currentYear = useCalendarStore((s) => s.currentYear);

  return (
    <div className="-mx-4 px-4 md:-mx-0 md:px-0">
      <div className="calendar-h-scroll overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto grid min-w-[800px] grid-cols-1 gap-6 md:min-w-0 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, month) => (
            <MonthGrid key={month} year={currentYear} month={month} />
          ))}
        </div>
      </div>
    </div>
  );
}
