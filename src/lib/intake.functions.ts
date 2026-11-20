import { createServerFn } from "@tanstack/react-start";
import type { ContractTerms, Extraction, IntakeField } from "./intake.types";

export type IntakeData = { extractions: Extraction[]; terms: ContractTerms[] };

/** Stored extractions (written by the owner) and the stored contract terms they are checked against. */
export const getIntakeData = createServerFn({ method: "GET" }).handler(async (): Promise<IntakeData> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const [ex, ct] = await Promise.all([
    db
      .from("contract_extractions")
      .select("file_name, contract_id, field, extracted_value, confidence, uncertain, model, extracted_at")
      .order("extracted_at", { ascending: false }),
    db.from("contracts").select("contract_id, end_date, auto_renew, notice_days, price_escalator_pct, termination_fee"),
  ]);
  if (ex.error || ct.error) {
    console.error("intake queries failed", ex.error ?? ct.error);
    throw new Error("Contract intake data is unavailable.");
  }
  return {
    extractions: ex.data.map((r) => ({
      file_name: r.file_name,
      contract_id: r.contract_id,
      field: r.field as IntakeField,
      extracted_value: r.extracted_value,
      confidence: r.confidence === null ? null : Number(r.confidence),
      uncertain: r.uncertain,
      model: r.model,
      extracted_at: r.extracted_at,
    })),
    terms: ct.data.map((r) => ({
      contract_id: r.contract_id,
      end_date: r.end_date,
      auto_renew: r.auto_renew,
      notice_days: r.notice_days,
      price_escalator_pct: Number(r.price_escalator_pct),
      termination_fee: Number(r.termination_fee),
    })),
  };
});
