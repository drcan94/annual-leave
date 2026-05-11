"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  FileDown,
  Printer,
  QrCode,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QRSyncModal } from "@/components/QRSyncModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { dateFnsLocale } from "@/lib/date-locale";
import { useCalendarStore, type CalendarView } from "@/stores";
import {
  copyToClipboard,
  downloadCSV,
  generateExportData,
} from "@/utils/export";

const VIEW_OPTIONS: readonly { id: CalendarView; label: string }[] = [
  { id: "yearly", label: "Yıllık" },
  { id: "custom", label: "Kısmi / Özel" },
  { id: "monthly", label: "Aylık" },
  { id: "weekly", label: "Haftalık" },
  { id: "daily", label: "Günlük" },
] as const;

export type HeaderProps = {
  className?: string;
  mobileSidebarOpen?: boolean;
  onMobileSidebarToggle?: () => void;
};

export function Header({
  className = "",
  mobileSidebarOpen = false,
  onMobileSidebarToggle,
}: HeaderProps) {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const currentYear = useCalendarStore((s) => s.currentYear);
  const setCurrentYear = useCalendarStore((s) => s.setCurrentYear);
  const focusedDate = useCalendarStore((s) => s.focusedDate);
  const setFocusedDate = useCalendarStore((s) => s.setFocusedDate);
  const resetAllData = useCalendarStore((s) => s.resetAllData);
  const leaves = useCalendarStore((s) => s.leaves);
  const persons = useCalendarStore((s) => s.persons);

  const [exportOpen, setExportOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [qrSyncOpen, setQrSyncOpen] = useState(false);
  const [qrSyncSession, setQrSyncSession] = useState(0);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onDocumentMouseUp = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mouseup", onDocumentMouseUp);
    return () => document.removeEventListener("mouseup", onDocumentMouseUp);
  }, [exportOpen]);

  const navLabel = useMemo(() => {
    if (view === "yearly" || view === "custom") {
      return String(currentYear);
    }
    const fd = parseISO(focusedDate);
    if (view === "monthly") {
      return format(fd, "MMMM yyyy", { locale: dateFnsLocale });
    }
    if (view === "weekly") {
      const weekStart = startOfWeek(fd, { weekStartsOn: 1 });
      const startLbl = format(weekStart, "d MMMM yyyy", {
        locale: dateFnsLocale,
      });
      return `${startLbl} tarihinden başlayan hafta`;
    }
    return format(fd, "EEEE, d MMMM yyyy", { locale: dateFnsLocale });
  }, [view, currentYear, focusedDate]);

  const prevAria =
    view === "yearly" || view === "custom"
      ? "Önceki yıl"
      : view === "monthly"
        ? "Önceki ay"
        : view === "weekly"
          ? "Önceki hafta"
          : "Önceki gün";

  const nextAria =
    view === "yearly" || view === "custom"
      ? "Sonraki yıl"
      : view === "monthly"
        ? "Sonraki ay"
        : view === "weekly"
          ? "Sonraki hafta"
          : "Sonraki gün";

  const goPrev = useCallback(() => {
    if (view === "yearly" || view === "custom") {
      setCurrentYear(currentYear - 1);
      return;
    }
    if (view === "monthly") {
      setFocusedDate(
        format(subMonths(parseISO(focusedDate), 1), "yyyy-MM-dd"),
      );
      return;
    }
    if (view === "weekly") {
      setFocusedDate(
        format(subWeeks(parseISO(focusedDate), 1), "yyyy-MM-dd"),
      );
      return;
    }
    setFocusedDate(format(subDays(parseISO(focusedDate), 1), "yyyy-MM-dd"));
  }, [view, currentYear, focusedDate, setCurrentYear, setFocusedDate]);

  const goNext = useCallback(() => {
    if (view === "yearly" || view === "custom") {
      setCurrentYear(currentYear + 1);
      return;
    }
    if (view === "monthly") {
      setFocusedDate(
        format(addMonths(parseISO(focusedDate), 1), "yyyy-MM-dd"),
      );
      return;
    }
    if (view === "weekly") {
      setFocusedDate(
        format(addWeeks(parseISO(focusedDate), 1), "yyyy-MM-dd"),
      );
      return;
    }
    setFocusedDate(format(addDays(parseISO(focusedDate), 1), "yyyy-MM-dd"));
  }, [view, currentYear, focusedDate, setCurrentYear, setFocusedDate]);

  const closeExportSoon = () => queueMicrotask(() => setExportOpen(false));

  const onDownloadCsv = useCallback(() => {
    const data = generateExportData(leaves, persons);
    if (data.length === 0) {
      window.alert("Dışa aktarılacak izin kaydı bulunmuyor.");
      return;
    }
    downloadCSV(data);
    closeExportSoon();
  }, [leaves, persons]);

  const onCopyTsv = useCallback(async () => {
    const data = generateExportData(leaves, persons);
    if (data.length === 0) {
      window.alert("Kopyalanacak izin kaydı bulunmuyor.");
      return;
    }
    try {
      await copyToClipboard(data);
      window.alert(
        "Tablo panoya kopyalandı. Sheets, Excel veya Notion’a yapıştırabilirsiniz.",
      );
      closeExportSoon();
    } catch {
      window.alert(
        "Panoya kopyalanamadı. Tarayıcı izinlerini kontrol edin.",
      );
    }
  }, [leaves, persons]);

  const onConfirmReset = useCallback(() => {
    resetAllData();
    setResetConfirmOpen(false);
  }, [resetAllData]);

  const headerCn = [
    "relative z-[60] flex flex-col gap-2 border-b border-zinc-200/80 bg-white/90 px-3 py-2 backdrop-blur-sm print:hidden dark:border-zinc-800/80 dark:bg-zinc-950/90 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <QRSyncModal
        key={qrSyncSession}
        open={qrSyncOpen}
        onClose={() => setQrSyncOpen(false)}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Tüm verileri sıfırlansın mı?"
        description="Tüm kişiler ve izin kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz."
        cancelLabel="İptal"
        confirmLabel="Onayla"
        confirmDestructive
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={onConfirmReset}
      />

      <header className={headerCn}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {onMobileSidebarToggle ? (
            <button
              type="button"
              aria-controls="calendar-sidebar-panel"
              aria-expanded={mobileSidebarOpen}
              onClick={onMobileSidebarToggle}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950 md:hidden"
            >
              <Users className="size-4 shrink-0" aria-hidden />
              Kişiler
            </button>
          ) : null}

          <label className="flex min-w-0 flex-1 basis-[min(100%,12rem)] items-center gap-1.5 md:hidden">
            <CalendarDays
              className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
              aria-hidden
            />
            <span className="sr-only">Takvim görünümü</span>
            <span className="relative min-w-0 flex-1">
              <select
                value={view}
                onChange={(e) => setView(e.target.value as CalendarView)}
                aria-label="Takvim görünümü"
                className="h-8 w-full min-w-0 appearance-none rounded-md border border-zinc-200 bg-white py-1 pl-2 pr-8 text-[11px] font-medium text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
              >
                {VIEW_OPTIONS.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500 opacity-70 dark:text-zinc-400"
                aria-hidden
              />
            </span>
          </label>

          <div className="hidden items-center gap-1.5 text-zinc-500 md:flex dark:text-zinc-400">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Görünüm
            </span>
          </div>

          <div
            className="hidden max-w-full md:inline-flex md:rounded-md md:border md:border-zinc-200 md:bg-zinc-50 md:p-0.5 dark:md:border-zinc-700 dark:md:bg-zinc-900"
            role="group"
            aria-label="Takvim görünümü"
          >
            {VIEW_OPTIONS.map(({ id, label }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-pressed={active}
                  className={[
                    "rounded px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950",
                    active
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-center">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            aria-label={prevAria}
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-0 max-w-[min(100%,20rem)] flex-1 px-1 text-center sm:min-w-[16rem] sm:flex-none">
            <span className="text-xs font-semibold leading-snug text-zinc-900 sm:text-sm dark:text-zinc-50">
              {navLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            aria-label={nextAria}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950/80 dark:focus-visible:ring-red-500 dark:focus-visible:ring-offset-zinc-950"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Sıfırla
          </button>

          <div
            className="relative"
            ref={exportMenuRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              aria-expanded={exportOpen}
              aria-haspopup="true"
              className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            >
              <Download className="size-3.5" aria-hidden />
              Dışa aktar
              <ChevronDown
                className={[
                  "size-3.5 opacity-70 transition-transform",
                  exportOpen ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>
            {exportOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-1 min-w-48 rounded-lg border border-zinc-200 bg-white py-0.5 shadow-lg shadow-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onDownloadCsv();
                  }}
                >
                  <FileDown
                    className="size-3.5 shrink-0 opacity-70"
                    aria-hidden
                  />
                  CSV İndir
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    void onCopyTsv();
                  }}
                >
                  <ClipboardCopy
                    className="size-3.5 shrink-0 opacity-70"
                    aria-hidden
                  />
                  Panoya Kopyala
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    closeExportSoon();
                    window.print();
                  }}
                >
                  <Printer className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  Takvimi Yazdır
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-zinc-500"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    closeExportSoon();
                    setQrSyncSession((s) => s + 1);
                    setQrSyncOpen(true);
                  }}
                >
                  <QrCode className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  QR ile Eşitle
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
