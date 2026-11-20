import { describe, expect, it } from "vitest";
import { compareField, groupByFile, INTAKE_FIELDS } from "./intake-logic";
import type { ContractTerms, Extraction } from "./intake.types";

const terms: ContractTerms = {
  contract_id: "C013",
  end_date: "2027-02-10",
  auto_renew: true,
  notice_days: 60,
  price_escalator_pct: 4,
  termination_fee: 100890,
};

describe("compareField", () => {
  it("matches dates written the same way", () => expect(compareField("end_date", "2027-02-10", terms)).toBe("match"));
  it("matches yes/no and true/false for auto-renewal", () => {
    expect(compareField("auto_renew", "Yes", terms)).toBe("match");
    expect(compareField("auto_renew", "false", terms)).toBe("differs");
  });
  it("matches numbers ignoring units, separators and %", () => {
    expect(compareField("notice_days", "60 days", terms)).toBe("match");
    expect(compareField("price_escalator_pct", "4.0%", terms)).toBe("match");
    expect(compareField("termination_fee", "BRL 100,890.00", terms)).toBe("match");
    expect(compareField("termination_fee", "100,000", terms)).toBe("differs");
  });
  it("cannot compare an empty value", () => expect(compareField("end_date", null, terms)).toBe("missing"));
});

describe("groupByFile", () => {
  it("groups the five fields per file, in a fixed order", () => {
    const rows: Extraction[] = [
      { file_name: "a.pdf", contract_id: "C013", field: "termination_fee", extracted_value: "1", confidence: 0.9, uncertain: false, model: "m", extracted_at: "2026-11-20T10:00:00Z" },
      { file_name: "a.pdf", contract_id: "C013", field: "end_date", extracted_value: "2027-02-10", confidence: 0.7, uncertain: true, model: "m", extracted_at: "2026-11-20T10:00:00Z" },
    ];
    const groups = groupByFile(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.fields.map((f) => f.field)).toEqual(["end_date", "termination_fee"]);
    expect(INTAKE_FIELDS[0]).toBe("end_date");
  });
});
