/** price_vs_benchmark_pct is a fraction from the view: 0.25 means 25% above the public list price. */
export function benchmarkComparison(pct: number): { text: string; above: boolean } {
  if (pct === 0) return { text: "At list price", above: false };
  const value = `${Math.abs(pct * 100).toFixed(1)}%`;
  return pct > 0 ? { text: `${value} above list price`, above: true } : { text: `${value} below list price`, above: false };
}

/** "video_conferencing" -> "Video conferencing" */
export function humanize(code: string): string {
  const s = code.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
