import { describe, expect, it } from "vitest";
import { benchmarkComparison, humanize } from "./vendor-format";

describe("vendor format", () => {
  it("states price above the public list price in words", () =>
    expect(benchmarkComparison(0.25)).toEqual({ text: "25.0% above list price", above: true }));
  it("states price below list price", () =>
    expect(benchmarkComparison(-0.084)).toEqual({ text: "8.4% below list price", above: false }));
  it("handles price at list price", () => expect(benchmarkComparison(0)).toEqual({ text: "At list price", above: false }));
  it("turns codes into labels", () => expect(humanize("video_conferencing")).toBe("Video conferencing"));
});
