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
    <div className="relative grid h-[100dvh] min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] bg-zinc-100 text-zinc-950 md:grid-cols-[220px_minmax(0,1fr)] print:h-[210mm] print:max-h-[210mm] print:min-h-0 print:grid-rows-[minmax(0,1fr)] print:bg-white print:grid-cols-1 dark:bg-zinc-950 dark:text-zinc-50">
      <Header
        className="col-span-full md:col-span-2"
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarToggle={() =>
          setMobileSidebarOpen((open) => !open)
        }
      />

      <main className="relative z-0 col-span-full row-start-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto md:col-span-1 md:col-start-2 md:row-start-2 print:col-span-full print:h-full print:min-h-0 print:w-full print:overflow-hidden print:flex-1 dark:scheme-dark">
        {children}
      </main>

      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 print:hidden md:hidden"
          aria-label="Şeridi kapat"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <Sidebar
        id="calendar-sidebar-panel"
        mobileDrawerOpen={mobileSidebarOpen}
        onMobileNavigate={() => setMobileSidebarOpen(false)}
      />
    </div>
  );
}
