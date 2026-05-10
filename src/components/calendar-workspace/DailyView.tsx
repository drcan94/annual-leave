"use client";

import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore, type Leave, type Person } from "@/stores";

function formatLeaveSpan(startIso: string, endIso: string): string {
  const localeOpts = { locale: dateFnsLocale };
  const a = parseISO(startIso);
  const b = parseISO(endIso);
  if (startIso === endIso) {
    return format(a, "d MMMM yyyy", localeOpts);
  }
  return `${format(a, "d MMM yyyy", localeOpts)} → ${format(b, "d MMM yyyy", localeOpts)}`;
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
      a.person.name.localeCompare(b.person.name, "tr", {
        sensitivity: "base",
      }),
    );
    return list;
  }, [focusedDate, leaves, persons]);

  const title = format(parseISO(focusedDate), "EEEE, d MMMM yyyy", {
    locale: dateFnsLocale,
  });

  return (
    <div className="mx-auto w-full max-w-md px-1 print:flex print:h-full print:min-h-0 print:max-w-none print:flex-1 print:flex-col print:overflow-hidden print:px-3">
      <header className="mb-4 shrink-0 border-b border-zinc-200/80 pb-3 print:mb-2 print:border-zinc-300 dark:border-zinc-800">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          Bu günle örtüşen izinler
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-white/60 px-4 py-8 text-center text-sm text-zinc-500 print:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          Bu tarihte izinde olan kimse yok.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto print:min-h-0 print:overflow-hidden print:pb-0">
          {rows.map(({ leave, person }) => (
            <li
              key={leave.id}
              className="flex gap-3 rounded-xl border border-zinc-200/90 bg-white/90 p-3 shadow-sm ring-1 ring-zinc-950/5 print:border-zinc-300 print:shadow-none print:ring-0 dark:border-zinc-800 dark:bg-zinc-900/60 dark:ring-white/10"
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
                    İzin aralığı
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
