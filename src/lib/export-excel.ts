import type { SheetData } from "write-excel-file/browser";

/** One exported column: the header text and how to read the value from a displayed row. */
export type ExportColumn<T> = { header: string; value: (row: T) => string | number | null };

/** Sheet layout shared by every table: a "Synthetic data" row, the headers, then the rows on screen. */
export function buildSheet<T>(columns: ExportColumn<T>[], rows: T[]): SheetData {
  const title = [{ value: "Synthetic data", type: String, fontWeight: "bold" as const }];
  const headers = columns.map((c) => ({ value: c.header, type: String, fontWeight: "bold" as const }));
  const body = rows.map((row) =>
    columns.map((c) => {
      const v = c.value(row);
      if (v === null || v === "") return null;
      return typeof v === "number" ? { value: v, type: Number } : { value: v, type: String };
    }),
  );
  return [title, headers, ...body] as SheetData;
}

export function exportFileName(page: string, today = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${page}-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.xlsx`;
}

/** Loads the Excel writer only when someone exports, so pages stay light. */
export async function exportToExcel<T>(page: string, columns: ExportColumn<T>[], rows: T[]): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  await writeXlsxFile(buildSheet(columns, rows)).toFile(exportFileName(page));
}
