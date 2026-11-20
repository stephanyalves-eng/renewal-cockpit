import { describe, expect, it } from "vitest";
import { formatBrlCompact, formatBrlFull, formatBrlMillions } from "./money";

describe("money", () => {
  it("formats KPIs as BRL 18.5M", () => expect(formatBrlCompact(18_500_000)).toBe("BRL 18.5M"));
  it("formats a precise variance as BRL 0.97M", () =>
    expect(formatBrlMillions(969_561.11)).toBe("BRL 0.97M"));
  it("formats tables as BRL 1,234,567", () => expect(formatBrlFull(1_234_567)).toBe("BRL 1,234,567"));
});
