"use client";

import { format, getISODay } from "date-fns";
import { memo, useCallback, useMemo, type CSSProperties } from "react";
import { useCalendarStore, type Leave, type Person } from "@/stores";
import { getContrastYIQ } from "@/utils/colors";
import { abbreviationLookup } from "@/utils/names";

type DayCellProps = {
  date: Date;
  /** Compact initials ribbons for dense grids; spacious bars for monthly. */
  density?: "compact" | "spacious";
  /** Passed from MonthGrid so abbreviations are built once per month, not once per cell. */
  abbrevLookup?: ReadonlyMap<string, string>;
};

function toIsoDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function leavesOverlappingDay(isoDay: string, leaves: Leave[]): Leave[] {
  return leaves.filter(
    (leave) => isoDay >= leave.startDate && isoDay <= leave.endDate,
  );
}

function personsForLeaves(
  dayLeaves: Leave[],
  persons: Person[],
): Person[] {
  const byId = new Map(persons.map((p) => [p.id, p] as const));
  const ordered: Person[] = [];
  const seen = new Set<string>();
  for (const leave of dayLeaves) {
    const person = byId.get(leave.personId);
    if (person && !seen.has(person.id)) {
      seen.add(person.id);
      ordered.push(person);
    }
  }
  return ordered;
}

function hexWithAlpha(hex: string, alphaHex: string): string {
  const t = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) {
    return `${t}${alphaHex}`;
  }
  return t;
}

function DayCellImpl({
  date,
  density = "compact",
  abbrevLookup,
}: DayCellProps) {
  const leaves = useCalendarStore((s) => s.leaves);
  const persons = useCalendarStore((s) => s.persons);
  const assignmentModalOpen = useCalendarStore((s) => s.assignmentModal.isOpen);
  const isSelecting = useCalendarStore((s) => s.isSelecting);
  const selectionRange = useCalendarStore((s) => s.selectionRange);
  const startSelection = useCalendarStore((s) => s.startSelection);
  const updateSelection = useCalendarStore((s) => s.updateSelection);
  const openModal = useCalendarStore((s) => s.openModal);

  const iso = useMemo(() => toIsoDateString(date), [date]);
  const dayLeaves = useMemo(
    () => leavesOverlappingDay(iso, leaves),
    [iso, leaves],
  );
  const peopleForDay = useMemo(
    () => personsForLeaves(dayLeaves, persons),
    [dayLeaves, persons],
  );

  const abbrevByPersonId = useMemo(() => {
    if (abbrevLookup != null) return abbrevLookup;
    return abbreviationLookup(persons);
  }, [abbrevLookup, persons]);

  const leaveBars = useMemo(() => {
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
    return rows;
  }, [dayLeaves, persons]);

  const isWeekend = getISODay(date) >= 6;
  const dayNum = date.getDate();

  const inSelection =
    selectionRange.start != null &&
    selectionRange.end != null &&
    iso >= selectionRange.start &&
    iso <= selectionRange.end;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (assignmentModalOpen) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType === "mouse") {
        e.preventDefault();
      }
      startSelection(iso);
    },
    [assignmentModalOpen, iso, startSelection],
  );

  const onPointerEnter = useCallback(() => {
    if (!isSelecting) return;
    updateSelection(iso);
  }, [isSelecting, iso, updateSelection]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const personId = e.dataTransfer.getData("personId");
      if (!personId) return;
      const ymd = format(date, "yyyy-MM-dd");
      openModal({
        defaultPersonId: personId,
        defaultStart: ymd,
        defaultEnd: ymd,
      });
    },
    [date, openModal],
  );

  const baseCellCompact =
    "relative flex min-h-8 w-full min-w-0 flex-col items-stretch justify-between overflow-hidden rounded-md border border-transparent text-[11px] font-medium transition-colors print:h-full print:min-h-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500";

  const baseCellSpacious =
    "relative flex min-h-[100px] w-full min-w-0 flex-col items-stretch rounded-lg border border-transparent p-1.5 text-left text-[11px] font-medium transition-colors print:h-full print:min-h-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500";

  const baseCell = density === "spacious" ? baseCellSpacious : baseCellCompact;

  const weekendBg = isWeekend
    ? "bg-zinc-50/90 dark:bg-zinc-800/40"
    : "bg-white dark:bg-zinc-900/55";

  let cellVisual = "";
  let surfaceStyle: CSSProperties | undefined;

  if (!inSelection && density === "spacious") {
    if (leaveBars.length === 0) {
      cellVisual = weekendBg;
    } else {
      cellVisual = [
        weekendBg,
        "border border-zinc-200/70 dark:border-zinc-700/70",
      ].join(" ");
    }
  } else if (!inSelection) {
    if (peopleForDay.length === 1) {
      const c = peopleForDay[0].color;
      surfaceStyle = {
        backgroundColor: hexWithAlpha(c, "22"),
        borderColor: hexWithAlpha(c, "55"),
      };
      cellVisual = [
        "border",
        isWeekend
          ? "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-600/50"
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    } else if (peopleForDay.length === 0) {
      cellVisual = weekendBg;
    } else {
      cellVisual = [
        weekendBg,
        "border border-zinc-200/80 dark:border-zinc-700/80",
      ].join(" ");
    }
  } else {
    cellVisual = [
      "border border-dashed border-blue-400 bg-blue-100/50 dark:border-blue-500 dark:bg-blue-900/30",
      isWeekend ? "ring-1 ring-inset ring-blue-300/40 dark:ring-blue-600/35" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${baseCell} touch-manipulation group relative select-none ${cellVisual} text-zinc-800 hover:bg-zinc-100/80 print:border-zinc-300 print:shadow-none dark:text-zinc-100 dark:hover:bg-zinc-800/70`}
      style={surfaceStyle}
      aria-label={`${iso}, izin eklemek için bırakın`}
    >
      {density === "spacious" ? (
        <>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-800 print:text-xs dark:text-zinc-100">
            {dayNum}
          </span>
          <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto print:mt-0.5 print:gap-0.5 print:overflow-hidden">
            {leaveBars.map(({ leave, person }) => (
              <div
                key={leave.id}
                className="w-full min-w-0 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-zinc-900 shadow-sm ring-1 ring-black/10 print:px-1 print:py-0 print:text-[8px] print:leading-tight print:ring-zinc-300 dark:text-zinc-950 dark:ring-white/15"
                style={{
                  backgroundColor: hexWithAlpha(person.color, "AA"),
                }}
                title={`${person.name} · ${leave.startDate} – ${leave.endDate}`}
              >
                {person.name}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {density === "compact" && peopleForDay.length > 0 ? (
            <div
              className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-left opacity-0 shadow-md ring-1 ring-zinc-950/5 transition-all duration-0 print:hidden group-hover:visible group-hover:opacity-100 group-hover:delay-150 group-hover:duration-200 dark:border-zinc-600 dark:bg-zinc-800 dark:ring-white/10 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:delay-150 group-focus-within:duration-200"
              role="tooltip"
            >
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                İzinde
              </p>
              <ul className="max-h-28 space-y-0.5 overflow-y-auto text-[10px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                {peopleForDay.map((person) => (
                  <li key={person.id} className="truncate">
                    {person.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <span className="shrink-0 self-center leading-none print:text-[10px]">
            {dayNum}
          </span>
          {peopleForDay.length > 0 ? (
            <div
              className="mt-0.5 flex w-full shrink-0 flex-col gap-px overflow-hidden print:mt-px"
              aria-label="İzindeki kişiler"
            >
              {peopleForDay.map((person) => (
                <div
                  key={person.id}
                  className="w-full truncate px-0.5 py-[2px] text-center text-[9px] font-semibold uppercase leading-none tracking-tighter print:py-0 print:text-[7px]"
                  style={{
                    backgroundColor: person.color,
                    color: getContrastYIQ(person.color),
                  }}
                  title={person.name}
                >
                  {abbrevByPersonId.get(person.id) ?? "?"}
                </div>
              ))}
            </div>
          ) : (
            <span className="h-1.5 shrink-0" aria-hidden />
          )}
        </>
      )}
    </button>
  );
}

export const DayCell = memo(DayCellImpl, (prev, next) =>
  prev.density === next.density &&
  prev.date.getTime() === next.date.getTime() &&
  prev.abbrevLookup === next.abbrevLookup,
);

DayCell.displayName = "DayCell";
