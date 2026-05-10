import { format, isBefore, parseISO } from "date-fns";
import { dateFnsLocale } from "@/lib/date-locale";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** View modes supported by the calendar UI (routing concerns stay out of the store). */
export type CalendarView =
  | "yearly"
  | "custom"
  | "monthly"
  | "weekly"
  | "daily";

const DEFAULT_SELECTED_MONTHS = [0, 1, 2, 3, 4, 5];

function normalizeHydratedMonths(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const next = value.filter(
    (m): m is number =>
      typeof m === "number" && Number.isInteger(m) && m >= 0 && m <= 11,
  );
  if (next.length !== value.length) return undefined;
  return next;
}

export interface Person {
  id: string;
  name: string;
  /** UI color as a hex string (e.g. `#3366ff`). */
  color: string;
}

export interface Leave {
  id: string;
  personId: string;
  /** Inclusive start, `YYYY-MM-DD`. */
  startDate: string;
  /** Inclusive end, `YYYY-MM-DD`. */
  endDate: string;
}

export type DateSelectionRange = {
  start: string | null;
  end: string | null;
};

export type AssignmentModalState = {
  isOpen: boolean;
  /** Bumps each time the modal opens; used to reset ephemeral form UI state. */
  sessionId?: number;
  defaultPersonId?: string;
  defaultStart?: string;
  defaultEnd?: string;
};

export type OpenAssignmentModalOptions = {
  defaultPersonId?: string;
  defaultStart?: string;
  defaultEnd?: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(label: string, value: string): void {
  if (!ISO_DATE_RE.test(value)) {
    throw new Error(
      `${label}: YYYY-AA-GG biçiminde olmalıdır; gelen: ${JSON.stringify(value)}`,
    );
  }
  const t = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(t)) {
    throw new Error(`${label}: geçersiz takvim tarihi: ${value}`);
  }
}

function assertLeaveRange(startDate: string, endDate: string): void {
  if (startDate > endDate) {
    throw new Error(
      `İzin aralığı geçersiz: başlangıç (${startDate}) bitişten (${endDate}) sonra olamaz.`,
    );
  }
}

function createId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export interface CalendarState {
  currentYear: number;
  view: CalendarView;
  /** Month indices `0 … 11` included in custom multi-month view / print selection. */
  selectedMonths: number[];
  persons: Person[];
  leaves: Leave[];
  /** Inclusive range, always chronological (start ≤ end). */
  selectionRange: DateSelectionRange;
  /** Anchor day for click–drag (mousedown ISO date). */
  selectionAnchor: string | null;
  isSelecting: boolean;
  assignmentModal: AssignmentModalState;
  /** Calendar day in focus for month / week / day views, `YYYY-MM-DD`. */
  focusedDate: string;
}

export interface CalendarActions {
  setView: (view: CalendarView) => void;
  toggleSelectedMonth: (monthIndex: number) => void;
  selectAllMonths: () => void;
  clearSelectedMonths: () => void;
  setCurrentYear: (year: number) => void;
  addPerson: (name: string, color: string) => void;
  updatePerson: (id: string, name: string, color: string) => void;
  removePerson: (id: string) => void;
  addLeave: (personId: string, startDate: string, endDate: string) => void;
  removeLeave: (id: string) => void;
  resetAllData: () => void;
  startSelection: (isoDate: string) => void;
  updateSelection: (isoDate: string) => void;
  endSelection: () => void;
  openModal: (opts?: OpenAssignmentModalOptions) => void;
  closeModal: () => void;
  setFocusedDate: (date: string) => void;
}

export type CalendarStore = CalendarState & CalendarActions;

const STORAGE_KEY = "annual-leave-calendar";

function getInitialYear(): number {
  return new Date().getFullYear();
}

function getTodayIsoDate(): string {
  return format(new Date(), "yyyy-MM-dd", { locale: dateFnsLocale });
}

const calendarStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
});

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      currentYear: getInitialYear(),
      view: "yearly",
      selectedMonths: [...DEFAULT_SELECTED_MONTHS],
      persons: [],
      leaves: [],
      selectionRange: { start: null, end: null },
      selectionAnchor: null,
      isSelecting: false,
      assignmentModal: { isOpen: false },
      focusedDate: getTodayIsoDate(),

      setView: (view) => set({ view }),

      toggleSelectedMonth: (monthIndex) => {
        if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
          throw new Error(
            `Ay indeksi 0–11 olmalıdır; gelen: ${JSON.stringify(monthIndex)}`,
          );
        }
        set((s) => {
          const setLike = new Set(s.selectedMonths);
          if (setLike.has(monthIndex)) {
            setLike.delete(monthIndex);
          } else {
            setLike.add(monthIndex);
          }
          const next = [...setLike];
          next.sort((a, b) => a - b);
          return { selectedMonths: next };
        });
      },

      selectAllMonths: () =>
        set({ selectedMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),

      clearSelectedMonths: () => set({ selectedMonths: [] }),

      setFocusedDate: (date) => {
        assertIsoDate("focusedDate", date);
        set({ focusedDate: date });
      },

      setCurrentYear: (year) => {
        if (!Number.isInteger(year)) {
          throw new Error(
            `Yıl bir tam sayı olmalıdır; gelen: ${JSON.stringify(year)}`,
          );
        }
        set({ currentYear: year });
      },

      addPerson: (name, color) => {
        const trimmed = name.trim();
        if (!trimmed) {
          throw new Error("Kişi adı boş olamaz.");
        }
        if (typeof color !== "string" || !color.trim()) {
          throw new Error("Bir renk seçmelisiniz.");
        }
        const person: Person = {
          id: createId(),
          name: trimmed,
          color: color.trim(),
        };
        set((s) => ({ persons: [...s.persons, person] }));
      },

      updatePerson: (id, name, color) => {
        const trimmed = name.trim();
        if (!trimmed) {
          throw new Error("Kişi adı boş olamaz.");
        }
        if (typeof color !== "string" || !color.trim()) {
          throw new Error("Bir renk seçmelisiniz.");
        }
        const { persons } = get();
        if (!persons.some((p) => p.id === id)) {
          throw new Error(`Bu kimliğe sahip kişi bulunamadı: ${JSON.stringify(id)}`);
        }
        set((s) => ({
          persons: s.persons.map((p) =>
            p.id === id
              ? { ...p, name: trimmed, color: color.trim() }
              : p,
          ),
        }));
      },

      removePerson: (id) => {
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          leaves: s.leaves.filter((l) => l.personId !== id),
        }));
      },

      addLeave: (personId, startDate, endDate) => {
        assertIsoDate("startDate", startDate);
        assertIsoDate("endDate", endDate);
        assertLeaveRange(startDate, endDate);
        const { persons } = get();
        if (!persons.some((p) => p.id === personId)) {
          throw new Error(
            `Bu kimliğe sahip kişi bulunamadı: ${JSON.stringify(personId)}`,
          );
        }
        const leave: Leave = {
          id: createId(),
          personId,
          startDate,
          endDate,
        };
        set((s) => ({ leaves: [...s.leaves, leave] }));
      },

      removeLeave: (id) => {
        set((s) => ({ leaves: s.leaves.filter((l) => l.id !== id) }));
      },

      resetAllData: () => {
        set({
          persons: [],
          leaves: [],
          selectionRange: { start: null, end: null },
          selectionAnchor: null,
          isSelecting: false,
          assignmentModal: { isOpen: false },
          focusedDate: getTodayIsoDate(),
        });
      },

      startSelection: (isoDate) => {
        assertIsoDate("startSelection", isoDate);
        set({
          isSelecting: true,
          selectionAnchor: isoDate,
          selectionRange: { start: isoDate, end: isoDate },
        });
      },

      updateSelection: (isoDate) => {
        assertIsoDate("updateSelection", isoDate);
        const { isSelecting, selectionAnchor } = get();
        if (!isSelecting || selectionAnchor === null) return;
        const anchor = parseISO(selectionAnchor);
        const probe = parseISO(isoDate);
        let start: string;
        let end: string;
        if (isBefore(anchor, probe)) {
          start = selectionAnchor;
          end = isoDate;
        } else if (isBefore(probe, anchor)) {
          start = isoDate;
          end = selectionAnchor;
        } else {
          start = selectionAnchor;
          end = isoDate;
        }
        set({ selectionRange: { start, end } });
      },

      endSelection: () =>
        set({
          isSelecting: false,
          selectionAnchor: null,
        }),

      openModal: (opts = {}) => {
        let nextRange: DateSelectionRange = { start: null, end: null };
        const { defaultStart, defaultEnd, defaultPersonId } = opts;
        if (defaultStart != null && defaultEnd != null) {
          assertIsoDate("defaultStart", defaultStart);
          assertIsoDate("defaultEnd", defaultEnd);
          assertLeaveRange(defaultStart, defaultEnd);
          nextRange = { start: defaultStart, end: defaultEnd };
        }

        set((state) => ({
          isSelecting: false,
          selectionAnchor: null,
          selectionRange: nextRange,
          assignmentModal: {
            isOpen: true,
            sessionId:
              (state.assignmentModal.sessionId ?? 0) + 1,
            defaultPersonId,
            defaultStart,
            defaultEnd,
          },
        }));
      },

      closeModal: () =>
        set({
          assignmentModal: { isOpen: false },
          selectionRange: { start: null, end: null },
          selectionAnchor: null,
          isSelecting: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: calendarStorage,
      partialize: (state) => ({
        currentYear: state.currentYear,
        view: state.view,
        selectedMonths: state.selectedMonths,
        persons: state.persons,
        leaves: state.leaves,
        focusedDate: state.focusedDate,
      }),
      migrate: (persistedState, fromVersion) => {
        void fromVersion;
        const raw = persistedState as {
          view?: unknown;
          selectedMonths?: unknown;
          [key: string]: unknown;
        };
        const viewStr = typeof raw.view === "string" ? raw.view : "";
        const view: CalendarView | undefined =
          viewStr === "half-yearly"
            ? "custom"
            : viewStr === "yearly" ||
                viewStr === "custom" ||
                viewStr === "monthly" ||
                viewStr === "weekly" ||
                viewStr === "daily"
              ? viewStr
              : undefined;
        const selectedMonths =
          normalizeHydratedMonths(raw.selectedMonths) ??
          [...DEFAULT_SELECTED_MONTHS];
        const { selectedMonths: _sm, view: _v, ...rest } = raw;
        void _sm;
        void _v;
        return {
          ...rest,
          ...(view !== undefined ? { view } : {}),
          selectedMonths,
        };
      },
      merge: (persistedState, currentState) => {
        type PersistedPartial = Partial<
          Pick<
            CalendarState,
            | "currentYear"
            | "persons"
            | "leaves"
            | "focusedDate"
            | "selectedMonths"
          >
        > & { view?: string };
        const persisted = (persistedState ?? {}) as PersistedPartial;
        const view: CalendarView =
          persisted.view === "half-yearly"
            ? "custom"
            : (persisted.view as CalendarView | undefined) ?? currentState.view;
        const normalizedMonths = normalizeHydratedMonths(persisted.selectedMonths);
        const selectedMonths =
          normalizedMonths !== undefined
            ? [...normalizedMonths].sort((a, b) => a - b)
            : [...DEFAULT_SELECTED_MONTHS];

        return {
          ...currentState,
          ...persisted,
          view,
          selectedMonths,
        };
      },
    },
  ),
);
