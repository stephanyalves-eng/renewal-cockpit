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

/** One row of v_variance_monthly: the waterfall split for one month, category and department. */
export type MonthlyVarianceRow = WaterfallRow & { month: string; is_forecast: boolean };

export type Component = "budget" | "price" | "volume" | "unbudgeted" | "landing";

/** The single filter state of the Budget vs. actual page. null = "All". */
export type BudgetFilters = {
  category: string | null;
  department: string | null;
  period: WaterfallScope;
  month: string | null;
  component: Component | null;
};
