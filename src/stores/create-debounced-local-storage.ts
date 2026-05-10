import type { StateStorage } from "zustand/middleware";

const DEBOUNCE_MS = 320;

/** Batches local writes so persist does not stringify on every selection/drag tick. Flushes before hide/unload. */
export function createDebouncedLocalStorage(): StateStorage<void> {
  let ls: Omit<Storage, "length" | "clear" | "key"> | null = null;
  let pendingWrites: Map<string, string> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    if (!ls || !pendingWrites) return;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingWrites.forEach((value, key) => {
      ls!.setItem(key, value);
    });
    pendingWrites.clear();
  };

  const scheduleFlush = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      flush();
      timer = null;
    }, DEBOUNCE_MS);
  };

  try {
    if (typeof window !== "undefined") {
      ls = window.localStorage;
      pendingWrites = new Map();
      window.addEventListener("beforeunload", flush);
      window.addEventListener("pagehide", flush);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
      });
    }
  } catch {
    ls = null;
    pendingWrites = null;
  }

  return {
    getItem: (name) => (ls ? ls.getItem(name) : null),
    setItem: (name, value) => {
      if (!ls || !pendingWrites) return;
      pendingWrites.set(name, value);
      scheduleFlush();
    },
    removeItem: (name) => {
      if (!ls) return;
      pendingWrites?.delete(name);
      flush();
      ls.removeItem(name);
    },
  };
}
