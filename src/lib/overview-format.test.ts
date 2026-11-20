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
