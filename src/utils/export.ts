import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Leave, Person } from "@/stores";

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

/**
 * Builds export rows for all leaves that resolve to a person.
 * Total days are inclusive of both start and end dates.
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
      const start = parseISO(leave.startDate);
      const end = parseISO(leave.endDate);
      const totalDays = differenceInCalendarDays(end, start) + 1;
      return {
        personName: person.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays,
      } satisfies ExportRow;
    })
    .filter((r): r is ExportRow => r !== null);

  rows.sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) return byStart;
    return a.personName.localeCompare(b.personName, undefined, {
      sensitivity: "base",
    });
  });

  return rows;
}

const CSV_COLUMNS = [
  "Person Name",
  "Start Date",
  "End Date",
  "Total Days",
] as const;

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
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `leave-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
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
  const tsv = lines.join("\n");
  await navigator.clipboard.writeText(tsv);
}
