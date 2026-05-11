"use client";

import { useCalendarStore } from "@/stores";
import { MonthGrid } from "./MonthGrid";

export function YearlyView() {
  const currentYear = useCalendarStore((s) => s.currentYear);

  return (
    <div className="-mx-4 px-4 md:-mx-0 md:px-0 print:m-0 print:flex print:h-full print:min-h-0 print:flex-1 print:flex-col print:overflow-hidden print:p-0">
      <div className="calendar-h-scroll w-full overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch] webkit-overflow-scrolling-touch print:h-full print:min-h-0 print:flex-1 print:overflow-hidden print:pb-0">
        <div className="mx-auto grid min-w-[800px] grid-cols-1 gap-6 md:min-w-0 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 print:grid print:h-full print:min-h-0 print:min-w-0 print:grid-cols-4 print:grid-rows-3 print:gap-1 print:overflow-hidden print:content-stretch">
          {Array.from({ length: 12 }, (_, month) => (
            <MonthGrid key={month} year={currentYear} month={month} />
          ))}
        </div>
      </div>
    </div>
  );
}
