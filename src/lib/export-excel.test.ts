import { describe, expect, it } from "vitest";
import { buildSheet, exportFileName, type ExportColumn } from "./export-excel";

type Row = { vendor: string; impact: number; note: string | null };
const columns: ExportColumn<Row>[] = [
  { header: "Vendor", value: (r) => r.vendor },
  { header: "Estimated annual impact (BRL)", value: (r) => r.impact },
  { header: "Note", value: (r) => r.note },
];

describe("excel export", () => {
  const sheet = buildSheet(columns, [
    { vendor: "Dealstream", impact: 168720, note: null },
    { vendor: "Helpdeskly", impact: 14364, note: "Escalator" },
  ]);

  it("starts every sheet with a synthetic-data row", () => expect(sheet[0]![0]).toMatchObject({ value: "Synthetic data" }));
  it("puts the column headers in the second row", () =>
    expect(sheet[1]!.map((c) => (c as { value: string }).value)).toEqual(["Vendor", "Estimated annual impact (BRL)", "Note"]));
  it("exports exactly the rows given, keeping numbers as numbers", () => {
    expect(sheet).toHaveLength(4);
    expect(sheet[2]).toEqual([{ value: "Dealstream", type: String }, { value: 168720, type: Number }, null]);
  });
  it("names the file after the page and the date", () =>
    expect(exportFileName("renewals", new Date(2026, 10, 20))).toBe("renewals-2026-11-20.xlsx"));
});
