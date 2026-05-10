"use client";

import { useEffect } from "react";
import { useCalendarStore } from "@/stores";
import { DailyView } from "./DailyView";
import { CustomMonthsView } from "./CustomMonthsView";
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

    document.addEventListener("pointerup", finalizeRangeSelection);
    return () =>
      document.removeEventListener("pointerup", finalizeRangeSelection);
  }, [isSelecting]);
}

export function CalendarWorkspace() {
  const view = useCalendarStore((s) => s.view);

  useFinalizeRangeSelection();

  const body = (() => {
    switch (view) {
      case "yearly":
        return <YearlyView />;
      case "custom":
        return <CustomMonthsView />;
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
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden bg-zinc-50/40 print:fixed print:inset-0 print:z-[9999] print:m-0 print:flex print:h-screen print:w-screen print:flex-col print:overflow-hidden print:bg-white print:p-2 dark:bg-zinc-950/30">
      <LeaveAssignmentModal />
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden p-4 print:m-0 print:min-h-0 print:flex-1 print:p-0 print:pt-0 md:p-5 xl:p-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:min-h-0 print:flex-1">
          {body}
        </div>
        <PrintLegend />
      </div>
    </div>
  );
}
