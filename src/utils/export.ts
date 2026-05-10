import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import { dateFnsLocale } from "@/lib/date-locale";
import type { Leave, Person } from "@/stores";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ExportRow = {
  personName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
};

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeTsvField(value: string): string {
  return value.replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function parseInclusiveIso(dateStr: string): Date | null {
  if (!ISO_DATE_RE.test(dateStr)) return null;
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

/**
 * Builds export rows for all leaves that resolve to a person.
 * Total days are inclusive of both start and end dates.
 * Rows with unparsable or reversed date ranges are skipped.
 */
export function generateExportData(
  leaves: Leave[],
  persons: Person[],
): ExportRow[] {
  const byId = new Map(persons.map((p) => [p.id, p] as const));

  const rows = leaves
    .map((leave) => {
      const person = byId.get(leave.personId);
      if (!person) return null;
      const start = parseInclusiveIso(leave.startDate);
      const end = parseInclusiveIso(leave.endDate);
      if (!start || !end) return null;
      if (leave.startDate > leave.endDate) return null;
      const totalDays = differenceInCalendarDays(end, start) + 1;
      if (!Number.isFinite(totalDays) || totalDays <= 0) return null;
      return {
        personName: person.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays,
      } satisfies ExportRow;
    })
    .filter((r): r is ExportRow => r !== null);

  rows.sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate, "tr");
    if (byStart !== 0) return byStart;
    return a.personName.localeCompare(b.personName, "tr", {
      sensitivity: "base",
    });
  });

  return rows;
}

const CSV_COLUMNS = [
  "Kişi Adı",
  "Başlangıç Tarihi",
  "Bitiş Tarihi",
  "Toplam Gün",
] as const;

/** UTF-8 BOM so Excel detects encoding for Turkish CSV. */
export const CSV_UTF8_BOM = "\uFEFF";

export function downloadCSV(data: ExportRow[]): void {
  const lines = [
    CSV_COLUMNS.join(","),
    ...data.map((row) =>
      [
        escapeCsvField(row.personName),
        row.startDate,
        row.endDate,
        String(row.totalDays),
      ].join(","),
    ),
  ];
  const csv = `${CSV_UTF8_BOM}${lines.join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `izin-aktar-${format(new Date(), "yyyy-MM-dd-HHmm", {
    locale: dateFnsLocale,
  })}.csv`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(data: ExportRow[]): Promise<void> {
  const lines = [
    CSV_COLUMNS.join("\t"),
    ...data.map((row) =>
      [
        escapeTsvField(row.personName),
        escapeTsvField(row.startDate),
        escapeTsvField(row.endDate),
        String(row.totalDays),
      ].join("\t"),
    ),
  ];
  const tsv = `${CSV_UTF8_BOM}${lines.join("\n")}`;
  await navigator.clipboard.writeText(tsv);
}
