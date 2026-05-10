"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";

type CalendarAppShellProps = {
  children: ReactNode;
};

export function CalendarAppShell({ children }: CalendarAppShellProps) {
  return (
    <div className="grid h-svh min-h-0 grid-cols-[220px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Header />
      <Sidebar />
      <main className="min-h-0 min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
