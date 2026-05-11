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
    <div className="fixed inset-0 overflow-hidden flex flex-col bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 print:relative print:inset-auto print:h-auto print:min-h-0 print:overflow-visible">
      <Header
        className="shrink-0"
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarToggle={() =>
          setMobileSidebarOpen((open) => !open)
        }
      />

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden print:min-h-0 print:flex-1">
        <Sidebar
          id="calendar-sidebar-panel"
          mobileDrawerOpen={mobileSidebarOpen}
          onMobileNavigate={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full min-h-0 webkit-overflow-scrolling-touch print:min-h-0 print:flex-1 print:overflow-hidden">
          {children}
        </main>
      </div>

      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 print:hidden md:hidden"
          aria-label="Şeridi kapat"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
    </div>
  );
}
