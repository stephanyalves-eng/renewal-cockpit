export type TrendRow = {
  month: string;
  category: string;
  owner_department: string;
  actual: number | null;
  budget: number | null;
  forecast: number | null;
};

export type WaterfallScope = "fy_landing" | "ytd";

export type WaterfallRow = {
  fiscal_year: number;
  scope: WaterfallScope;
  category: string;
  owner_department: string;
  budget: number;
  price: number;
  volume: number;
  unbudgeted: number;
  landing: number;
};
