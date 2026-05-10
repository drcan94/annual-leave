"use client";

import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { useCalendarStore, type Leave, type Person } from "@/stores";

function formatLeaveSpan(startIso: string, endIso: string): string {
  const a = parseISO(startIso);
  const b = parseISO(endIso);
  if (startIso === endIso) {
    return format(a, "MMMM d, yyyy");
  }
  return `${format(a, "MMM d, yyyy")} → ${format(b, "MMM d, yyyy")}`;
}

export function DailyView() {
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const leaves = useCalendarStore((s) => s.leaves);
  const persons = useCalendarStore((s) => s.persons);

  const rows = useMemo(() => {
    const list = leaves
      .filter(
        (l) => focusedDate >= l.startDate && focusedDate <= l.endDate,
      )
      .map((leave) => {
        const person = persons.find((p) => p.id === leave.personId);
        return person ? { leave, person } : null;
      })
      .filter((x): x is { leave: Leave; person: Person } => x !== null);
    list.sort((a, b) =>
      a.person.name.localeCompare(b.person.name, undefined, {
        sensitivity: "base",
      }),
    );
    return list;
  }, [focusedDate, leaves, persons]);

  const title = format(parseISO(focusedDate), "EEEE, MMMM d, yyyy");

  return (
    <div className="mx-auto w-full max-w-md px-1">
      <header className="mb-4 border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          Leave overlapping this day
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-white/60 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          No one is on leave for this date.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ leave, person }) => (
            <li
              key={leave.id}
              className="flex gap-3 rounded-xl border border-zinc-200/90 bg-white/90 p-3 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:ring-white/10"
            >
              <span
                className="mt-0.5 size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                style={{ backgroundColor: person.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {person.name}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-500 dark:text-zinc-500">
                    Leave span
                  </span>
                  <br />
                  {formatLeaveSpan(leave.startDate, leave.endDate)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
