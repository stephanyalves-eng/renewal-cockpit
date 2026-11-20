import { describe, expect, it } from "vitest";
import { formatPercent, getLargestOverrunCategory } from "./overview-format";

describe("overview formatting", () => {
  it("formats a view fraction as a percentage", () => {
    expect(formatPercent(0.05527174702181134)).toBe("5.5%");
  });

  it("adds a plus sign to a positive category variance", () => {
    expect(formatPercent(0.1840467449639657, true)).toBe("+18.4%");
  });
});

describe("largest overrun", () => {
  it("selects only Cloud from the populated category figures", () => {
    const rows = [
      { category: "Data and security", landing_vs_budget: -34453.62 },
      { category: "Cloud", landing_vs_budget: 873336.24 },
      { category: "SaaS", landing_vs_budget: 121647.86 },
      { category: "Marketing", landing_vs_budget: 11879.2 },
      { category: "Professional services", landing_vs_budget: -2848.57 },
    ];
    expect(getLargestOverrunCategory(rows)).toBe("Cloud");
  });

  it("highlights nothing when every category is under budget", () => {
    expect(getLargestOverrunCategory([{ category: "SaaS", landing_vs_budget: -1 }])).toBeNull();
  });
});

import { formatDate, dateParts } from "./overview-format";
import { formatBrlKpi } from "./money";
describe("cockpit formats", () => {
  it("formats the anchor date as 30 Nov 2026", () => expect(formatDate("2026-11-30")).toBe("30 Nov 2026"));
  it("gives deadline day and month", () => expect(dateParts("2026-12-12")).toMatchObject({ day: "12", month: "Dec" }));
  it("shows FY landing with two decimals in millions", () => expect(formatBrlKpi(18512345)).toBe("BRL 18.51M"));
  it("shows thousands compactly", () => expect(formatBrlKpi(910600)).toBe("BRL 910.6K"));
});

import { effectiveStatus } from "./demo-status";
describe("demo status", () => {
  it("browser value overrides the database value", () => expect(effectiveStatus("active", "C1", { C1: "terminated" })).toBe("terminated"));
  it("falls back to the database value", () => expect(effectiveStatus("active", "C1", {})).toBe("active"));
});

import { formatPercentOrDash, kpisFor } from "./overview-format";
import type { CategoryKpis, OverviewKpis } from "./overview.types";

describe("category selection", () => {
  const overall = { fy_landing: 100, urgent_decisions: 2 } as OverviewKpis;
  const cloud = { category: "Cloud", fy_landing: 40, urgent_decisions: 0 } as CategoryKpis;
  it("uses the consolidated KPIs when no category is selected", () => expect(kpisFor(overall, [cloud], null)).toBe(overall));
  it("uses the category row when one is selected", () => expect(kpisFor(overall, [cloud], "Cloud")).toBe(cloud));
  it("returns null for an unknown category instead of showing other numbers", () => expect(kpisFor(overall, [cloud], "SaaS")).toBeNull());
  it("shows a dash when the percentage is undefined", () => expect(formatPercentOrDash(null)).toBe("—"));
});
