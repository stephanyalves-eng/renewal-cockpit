import { Download } from "lucide-react";
import { useState } from "react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

/** "Export to Excel" for the rows and columns currently shown in a table. */
export function ExportButton<T>({ page, columns, rows }: { page: string; columns: ExportColumn<T>[]; rows: T[] }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy || rows.length === 0}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            await exportToExcel(page, columns, rows);
          } catch (e) {
            console.error("Excel export failed", e);
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-[2px] border border-input bg-card px-3 py-1.5 text-sm font-medium text-forest hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {busy ? "Exporting…" : "Export to Excel"}
      </button>
      {failed && <span role="alert" className="text-sm text-destructive">Export failed. Try again.</span>}
    </span>
  );
}
