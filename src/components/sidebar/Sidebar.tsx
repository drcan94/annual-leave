"use client";

import { Check, Dices, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { generateDistinctColor } from "@/utils/colors";
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

export type SidebarProps = {
  id?: string;
  mobileDrawerOpen?: boolean;
  onMobileNavigate?: () => void;
};

export function Sidebar({
  id,
  mobileDrawerOpen = false,
  onMobileNavigate,
}: SidebarProps) {
  const persons = useCalendarStore((s) => s.persons);
  const addPerson = useCalendarStore((s) => s.addPerson);
  const updatePerson = useCalendarStore((s) => s.updatePerson);
  const removePerson = useCalendarStore((s) => s.removePerson);

  const existingPalette = useMemo(
    () =>
      [...SWATCHES, ...persons.map((p) => p.color)].filter(
        (hex, i, arr) => arr.indexOf(hex) === i,
      ),
    [persons],
  );

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(SWATCHES[0]);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [pendingDeletePerson, setPendingDeletePerson] = useState<
    Person | null
  >(null);

  const shuffleAddColor = useCallback(() => {
    setColor(generateDistinctColor(existingPalette));
  }, [existingPalette]);

  const shuffleEditColor = useCallback(() => {
    const palette: string[] = [...SWATCHES];
    for (const p of persons) {
      if (p.id !== editingPersonId) palette.push(p.color);
    }
    setEditColor(generateDistinctColor(palette));
  }, [persons, editingPersonId]);

  const submit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      addPerson(trimmed, color);
      setName("");
      setColor(generateDistinctColor([...existingPalette, color]));
      onMobileNavigate?.();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Kişi eklenemedi. Tekrar deneyin.";
      window.alert(message);
    }
  }, [addPerson, name, color, existingPalette, onMobileNavigate]);

  const canAdd = name.trim().length > 0;

  const confirmRemovePerson = useCallback(() => {
    if (!pendingDeletePerson) return;
    removePerson(pendingDeletePerson.id);
    setEditingPersonId((edId) =>
      edId === pendingDeletePerson.id ? null : edId,
    );
    setPendingDeletePerson(null);
  }, [pendingDeletePerson, removePerson]);

  const startEdit = useCallback((person: Person) => {
    setEditingPersonId(person.id);
    setEditName(person.name);
    setEditColor(person.color);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingPersonId(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingPersonId === null) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      updatePerson(editingPersonId, trimmed, editColor);
      setEditingPersonId(null);
      onMobileNavigate?.();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Kişi güncellenemedi. Tekrar deneyin.";
      window.alert(message);
    }
  }, [editColor, editName, editingPersonId, updatePerson, onMobileNavigate]);

  const onDragStart = useCallback(
    (personId: string) => (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("personId", personId);
      e.dataTransfer.effectAllowed = "copy";
    },
    [],
  );

  const asideCn = [
    "print:hidden flex min-h-0 w-[220px] shrink-0 flex-col border-r border-zinc-200/80 bg-white transition-transform duration-300 ease-out dark:border-zinc-800/80 dark:bg-zinc-950",
    "max-md:pointer-events-none max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[85vw] max-md:max-w-[320px] max-md:-translate-x-full max-md:overflow-y-auto max-md:shadow-2xl",
    mobileDrawerOpen
      ? "max-md:pointer-events-auto max-md:translate-x-0"
      : "",
    "md:pointer-events-auto md:relative md:min-h-0 md:translate-x-0 md:overflow-y-auto md:bg-zinc-50/90 md:shadow-none md:dark:bg-zinc-950/50",
  ].join(" ");

  return (
    <>
      <ConfirmDialog
        open={pendingDeletePerson != null}
        title="Kişi silinsin mi?"
        description={
          pendingDeletePerson
            ? `“${pendingDeletePerson.name}” ve bu kişiye ait izin kayıtları kalıcı olarak silinecek.`
            : ""
        }
        cancelLabel="İptal"
        confirmLabel="Onayla"
        confirmDestructive
        onCancel={() => setPendingDeletePerson(null)}
        onConfirm={confirmRemovePerson}
      />

      <aside id={id} className={asideCn} aria-label="Kişi listesi">
        <div className="shrink-0 border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Kişiler
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Kişi adı"
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
                  aria-label={`Renk seç: ${hex}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="sr-only">Özel renk</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border border-zinc-200 bg-white p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                />
              </label>
              <button
                type="button"
                onClick={shuffleAddColor}
                className="inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                aria-label="Rastgele renk"
                title="Rastgele renk"
              >
                <Dices className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canAdd}
                className="h-7 min-w-28 flex-1 rounded-md bg-zinc-900 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {persons.length === 0 ? (
            <p className="px-1 py-2 text-center text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
              Henüz kimse eklenmemiş. İzin eklemeye başlamak için bir kişi
              ekleyin.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {persons.map((person) => {
                const isEditing = editingPersonId === person.id;
                return (
                  <li key={person.id}>
                    {isEditing ? (
                      <div
                        draggable={false}
                        className="flex flex-col gap-1.5 rounded-md border border-zinc-200/80 bg-white px-1.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/80"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                          }}
                          autoFocus
                          autoComplete="off"
                          className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus-visible:ring-zinc-500/40"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="h-7 w-10 shrink-0 cursor-pointer rounded border border-zinc-200 bg-white p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                            aria-label="Kişi rengi"
                          />
                          <button
                            type="button"
                            onClick={shuffleEditColor}
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                            aria-label="Rastgele renk"
                          >
                            <Dices className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                            aria-label="Kaydet"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                            aria-label="İptal"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
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
                          onClick={() => startEdit(person)}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 opacity-70 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500/60"
                          aria-label={`Düzenle: ${person.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setPendingDeletePerson(person)}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 opacity-70 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/80 group-hover:opacity-100 dark:hover:bg-red-950/60 dark:hover:text-red-400 dark:focus-visible:ring-red-500/60"
                          aria-label={`Sil: ${person.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
