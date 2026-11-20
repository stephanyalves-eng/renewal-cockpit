export type IntakeField = "end_date" | "auto_renew" | "notice_days" | "price_escalator_pct" | "termination_fee";

export type Extraction = {
  file_name: string;
  contract_id: string | null;
  field: IntakeField;
  extracted_value: string | null;
  confidence: number | null;
  uncertain: boolean;
  model: string | null;
  extracted_at: string;
};

export type ContractTerms = {
  contract_id: string;
  end_date: string;
  auto_renew: boolean;
  notice_days: number;
  price_escalator_pct: number;
  termination_fee: number;
};
