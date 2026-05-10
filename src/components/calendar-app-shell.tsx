"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";

type CalendarAppShellProps = {
  children: ReactNode;
};

export function CalendarAppShell({ children }: CalendarAppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="relative grid h-svh min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] bg-zinc-100 text-zinc-950 md:grid-cols-[220px_minmax(0,1fr)] print:h-auto print:min-h-0 print:grid-cols-1 dark:bg-zinc-950 dark:text-zinc-50">
      <Header
        className="col-span-full md:col-span-2"
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarToggle={() =>
          setMobileSidebarOpen((open) => !open)
        }
      />

      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-[2px] print:hidden md:hidden"
          aria-label="Şeridi kapat"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <Sidebar
        id="calendar-sidebar-panel"
        mobileDrawerOpen={mobileSidebarOpen}
        onMobileNavigate={() => setMobileSidebarOpen(false)}
      />

      <main className="relative z-0 col-span-full min-h-0 min-w-0 overflow-hidden md:col-start-2 md:row-start-2 print:col-span-full print:w-full print:overflow-visible dark:scheme-dark">
        {children}
      </main>
    </div>
  );
}
