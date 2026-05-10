"use client";

import { useEffect } from "react";
import { useCalendarStore } from "@/stores";
import { DailyView } from "./DailyView";
import { HalfYearlyView } from "./HalfYearlyView";
import { LeaveAssignmentModal } from "./LeaveAssignmentModal";
import { MonthlyView } from "./MonthlyView";
import { WeeklyView } from "./WeeklyView";
import { PrintLegend } from "./PrintLegend";
import { YearlyView } from "./YearlyView";

function useFinalizeRangeSelection() {
  const isSelecting = useCalendarStore((s) => s.isSelecting);

  useEffect(() => {
    if (!isSelecting) return;

    const finalizeRangeSelection = () => {
      const { isSelecting: still, selectionRange, endSelection, openModal } =
        useCalendarStore.getState();
      if (!still) return;
      const { start, end } = selectionRange;
      endSelection();
      if (start != null && end != null) {
        openModal({ defaultStart: start, defaultEnd: end });
      }
    };

    document.addEventListener("mouseup", finalizeRangeSelection);
    return () => document.removeEventListener("mouseup", finalizeRangeSelection);
  }, [isSelecting]);
}

export function CalendarWorkspace() {
  const view = useCalendarStore((s) => s.view);

  useFinalizeRangeSelection();

  const body = (() => {
    switch (view) {
      case "yearly":
        return <YearlyView />;
      case "half-yearly":
        return <HalfYearlyView />;
      case "monthly":
        return <MonthlyView />;
      case "weekly":
        return <WeeklyView />;
      case "daily":
        return <DailyView />;
      default:
        return null;
    }
  })();

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-auto bg-zinc-50/40 print:w-full print:overflow-visible dark:bg-zinc-950/30">
      <LeaveAssignmentModal />
      <div className="min-h-0 w-full flex-1 p-4 print:w-full print:overflow-visible md:p-5 xl:p-6">
        {body}
        <PrintLegend />
      </div>
    </div>
  );
}
