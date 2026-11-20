import { formatBrlCents } from "./money";
import { formatDate } from "./overview-format";
import type { ContractTerms, Extraction, IntakeField } from "./intake.types";

export const INTAKE_FIELDS: IntakeField[] = ["end_date", "auto_renew", "notice_days", "price_escalator_pct", "termination_fee"];

export const FIELD_LABEL: Record<IntakeField, string> = {
  end_date: "End date",
  auto_renew: "Auto-renewal",
  notice_days: "Notice period (days)",
  price_escalator_pct: "Price escalator (%)",
  termination_fee: "Termination fee (BRL)",
};

const toNumber = (s: string) => Number(s.replace(/[^0-9.-]/g, ""));

/** Compares what the AI read from a PDF with the value stored for that contract. */
export function compareField(field: IntakeField, extracted: string | null, terms: ContractTerms): "match" | "differs" | "missing" {
  if (extracted === null || extracted.trim() === "") return "missing";
  const v = extracted.trim();
  switch (field) {
    case "end_date":
      return v.slice(0, 10) === terms.end_date ? "match" : "differs";
    case "auto_renew": {
      const yes = /^(yes|true|y|sim)$/i.test(v);
      const no = /^(no|false|n|não|nao)$/i.test(v);
      if (!yes && !no) return "differs";
      return yes === terms.auto_renew ? "match" : "differs";
    }
    default: {
      const n = toNumber(v);
      if (Number.isNaN(n)) return "differs";
      return Math.abs(n - Number(terms[field])) < 0.01 ? "match" : "differs";
    }
  }
}

export type ExtractionGroup = {
  file_name: string;
  contract_id: string | null;
  model: string | null;
  extracted_at: string;
  fields: Extraction[];
};

export function groupByFile(rows: Extraction[]): ExtractionGroup[] {
  const groups = new Map<string, ExtractionGroup>();
  for (const r of rows) {
    const g = groups.get(r.file_name) ?? { file_name: r.file_name, contract_id: r.contract_id, model: r.model, extracted_at: r.extracted_at, fields: [] };
    g.fields.push(r);
    if (r.extracted_at > g.extracted_at) g.extracted_at = r.extracted_at;
    groups.set(r.file_name, g);
  }
  for (const g of groups.values()) g.fields.sort((a, b) => INTAKE_FIELDS.indexOf(a.field) - INTAKE_FIELDS.indexOf(b.field));
  return [...groups.values()].sort((a, b) => a.file_name.localeCompare(b.file_name));
}

/** Formats a value the same way for "Extracted" and "On file"; unparseable text is returned as is. */
export function formatFieldValue(field: IntakeField, raw: string | number | boolean | null): string {
  if (raw === null || raw === "") return "—";
  const v = String(raw).trim();
  switch (field) {
    case "end_date":
      return /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : v;
    case "auto_renew":
      if (/^(yes|true|y|sim)$/i.test(v)) return "Yes";
      if (/^(no|false|n|não|nao)$/i.test(v)) return "No";
      return v;
    default: {
      const n = Number(v.replace(/[^0-9.-]/g, ""));
      if (v === "" || Number.isNaN(n)) return v;
      if (field === "notice_days") return `${n} days`;
      if (field === "price_escalator_pct") return `${n.toFixed(1)}%`;
      return formatBrlCents(n);
    }
  }
}

export function onFileRaw(field: IntakeField, t: ContractTerms): string | number | boolean {
  return t[field];
}
