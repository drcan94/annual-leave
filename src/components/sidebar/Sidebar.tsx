"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useCalendarStore, type Person } from "@/stores";

const SWATCHES = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#8b5cf6",
  "#64748b",
] as const;

export function Sidebar() {
  const persons = useCalendarStore((s) => s.persons);
  const addPerson = useCalendarStore((s) => s.addPerson);
  const removePerson = useCalendarStore((s) => s.removePerson);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(SWATCHES[0]);

  const submit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      addPerson(trimmed, color);
      setName("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not add person.";
      window.alert(message);
    }
  }, [addPerson, name, color]);

  const canAdd = name.trim().length > 0;

  const onRemove = useCallback(
    (person: Person) => {
      if (
        typeof window !== "undefined" &&
        window.confirm(`Remove ${person.name} and their leave entries?`)
      ) {
        removePerson(person.id);
      }
    },
    [removePerson],
  );

  const onDragStart = useCallback(
    (personId: string) => (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("personId", personId);
      e.dataTransfer.effectAllowed = "copy";
    },
    [],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-200/80 bg-zinc-50/90 dark:border-zinc-800/80 dark:bg-zinc-950/50">
      <div className="shrink-0 border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          People
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Name"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus-visible:ring-zinc-500/40"
            autoComplete="off"
          />
          <div className="flex flex-wrap items-center gap-1">
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => setColor(hex)}
                className={[
                  "size-5 rounded border transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950",
                  color === hex
                    ? "ring-2 ring-zinc-900 ring-offset-1 ring-offset-zinc-50 dark:ring-zinc-100 dark:ring-offset-zinc-950"
                    : "border-zinc-200 dark:border-zinc-700",
                ].join(" ")}
                style={{ backgroundColor: hex }}
                aria-label={`Pick swatch ${hex}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="sr-only">Custom color</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-zinc-200 bg-white p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
              />
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={!canAdd}
              className="h-7 flex-1 rounded-md bg-zinc-900 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {persons.length === 0 ? (
          <p className="px-1 py-2 text-center text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
            No people yet. Add someone to start scheduling leave.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {persons.map((person) => (
              <li key={person.id}>
                <div
                  draggable
                  onDragStart={onDragStart(person.id)}
                  className="group flex cursor-grab items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-1.5 py-1 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900/80"
                >
                  <GripVertical
                    className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                    aria-hidden
                  />
                  <span
                    className="size-3 shrink-0 rounded-sm ring-1 ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: person.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {person.name}
                  </span>
                  <button
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onRemove(person)}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 opacity-70 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/80 group-hover:opacity-100 dark:hover:bg-red-950/60 dark:hover:text-red-400 dark:focus-visible:ring-red-500/60"
                    aria-label={`Remove ${person.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
