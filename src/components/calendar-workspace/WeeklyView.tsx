"use client";

import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { useMemo } from "react";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore, type Leave, type Person } from "@/stores";

function leavesOnDay(iso: string, leaves: Leave[]): Leave[] {
  return leaves.filter((l) => iso >= l.startDate && iso <= l.endDate);
}

export function WeeklyView() {
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const leaves = useCalendarStore((s) => s.leaves);
  const persons = useCalendarStore((s) => s.persons);

  const localeOpts = { locale: dateFnsLocale };

  const days = useMemo(() => {
    const start = startOfWeek(parseISO(focusedDate), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [focusedDate]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] md:-mx-0 md:px-0">
      <div className="grid min-w-[800px] grid-cols-7 gap-2 md:min-w-0 md:gap-3">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const dayLeaves = leavesOnDay(iso, leaves);
          const rows = dayLeaves
            .map((leave) => {
              const person = persons.find((p) => p.id === leave.personId);
              return person ? { leave, person } : null;
            })
            .filter((r): r is { leave: Leave; person: Person } => r !== null);
          rows.sort((a, b) =>
            a.person.name.localeCompare(b.person.name, "tr", {
              sensitivity: "base",
            }),
          );

          return (
            <section
              key={iso}
              className="flex min-h-[14rem] min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white/90 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:ring-white/10"
              aria-label={format(day, "EEEE d MMMM", localeOpts)}
            >
              <header className="border-b border-zinc-100 px-2.5 py-2 dark:border-zinc-800">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {format(day, "EEE", localeOpts)}
                </p>
                <p className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {format(day, "d", localeOpts)}
                </p>
                <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  {format(day, "MMM yyyy", localeOpts)}
                </p>
              </header>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
                {rows.length === 0 ? (
                  <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                    İzin yok
                  </p>
                ) : (
                  rows.map(({ leave, person }) => (
                    <div
                      key={leave.id}
                      className="rounded-lg border border-zinc-200/80 border-l-[3px] bg-zinc-50/90 px-2 py-1.5 text-[11px] font-medium text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100"
                      style={{ borderLeftColor: person.color }}
                    >
                      <span className="line-clamp-2 leading-snug">
                        {person.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
