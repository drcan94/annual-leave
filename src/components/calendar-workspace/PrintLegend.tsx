"use client";

import { useMemo } from "react";
import { useCalendarStore } from "@/stores";

export function PrintLegend() {
  const persons = useCalendarStore((s) => s.persons);

  const rows = useMemo(
    () =>
      [...persons].sort((a, b) =>
        a.name.localeCompare(b.name, "tr", { sensitivity: "base" }),
      ),
    [persons],
  );

  if (rows.length === 0) return null;

  return (
    <div
      role="note"
      aria-label="Kişi renk eşlemesi"
      className="hidden print:mt-1 print:flex print:flex-shrink-0 print:flex-wrap print:gap-x-4 print:gap-y-1 print:text-[10px] print:leading-snug"
    >
      {rows.map((person) => (
        <div
          key={person.id}
          className="inline-flex max-w-56 items-center gap-2"
        >
          <span
            className="size-3 shrink-0 rounded-sm ring-1 ring-zinc-900/20"
            style={{ backgroundColor: person.color }}
            aria-hidden
          />
          <span className="min-w-0 truncate font-medium text-zinc-900">
            {person.name}
          </span>
        </div>
      ))}
    </div>
  );
}
