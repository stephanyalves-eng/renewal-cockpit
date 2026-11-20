import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { overviewKpisQueryOptions } from "@/components/overview-dashboard";
import { PageContainer, PageHeader } from "@/components/page-layout";
import { QuerySection } from "@/components/query-section";
import {
  componentByMonth,
  filterRows,
  landingSplit,
  lastActualMonth,
  monthlySeries,
  optionsOf,
  periodRows,
  stepsFromTotals,
  sumSplit,
  type SplitTotals,
  type WaterfallStep,
} from "@/lib/budget-logic";
import { getMonthlyTrend, getVarianceMonthly } from "@/lib/budget.functions";
import type { BudgetFilters, Component, WaterfallScope } from "@/lib/budget.types";
import { formatBrlFull, formatBrlKpi } from "@/lib/money";
import { dateParts, formatDate, formatPercentOrDash } from "@/lib/overview-format";

const trendQueryOptions = queryOptions({ queryKey: ["budget", "trend"], queryFn: () => getMonthlyTrend() });
const monthlyVarianceQueryOptions = queryOptions({ queryKey: ["budget", "variance-monthly"], queryFn: () => getVarianceMonthly() });
const DESCRIPTION = "Monthly actuals and forecast against budget, and how the year moves from budget to landing.";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget vs. actual · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Budget vs. actual · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(trendQueryOptions);
    void context.queryClient.prefetchQuery(monthlyVarianceQueryOptions);
    void context.queryClient.prefetchQuery(overviewKpisQueryOptions);
  },
  component: Page,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-6xl px-4 py-16" role="alert">
      <h1 className="page-title text-4xl">The Budget vs. actual page couldn't load</h1>
      <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </main>
  ),
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";
const FOREST = "var(--forest)";
const SAGE = "var(--sage)";
const BRONZE = "var(--bronze)";
const EMPTY: BudgetFilters = { category: null, department: null, period: "fy_landing", month: null, component: null };
const PERIOD_LABEL: Record<WaterfallScope, string> = { fy_landing: "Full year (actuals + forecast)", ytd: "Year to date" };
const COMPONENT_LABEL: Record<Component, string> = { budget: "Budget", price: "Price", volume: "Volume", unbudgeted: "Unbudgeted", landing: "Landing" };
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const millions = (v: number) => `${(v / 1e6).toFixed(1)}`;
const monthLabel = (iso: string) => {
  const p = dateParts(iso);
  return `${p.month} ${p.year.slice(2)}`;
};
const fullMonth = (iso: string) => `${FULL_MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const signed = (v: number) => (v === 0 ? "BRL 0" : `${v > 0 ? "+" : "-"}${formatBrlKpi(Math.abs(v))}`);

function sliceLabel(f: BudgetFilters): string {
  return [f.category ?? "All categories", f.department ?? "All departments", f.month ? fullMonth(f.month) : PERIOD_LABEL[f.period]].join(" · ");
}

function Page() {
  const [filters, setFilters] = useState<BudgetFilters>(EMPTY);
  const update = (patch: Partial<BudgetFilters>) => setFilters((f) => ({ ...f, ...patch }));
  return (
    <PageContainer>
      <PageHeader eyebrow="Budget" title="Budget vs. actual" description={DESCRIPTION} />
      <QuerySection fallback={<div className="surface mt-6 h-28 animate-pulse bg-muted" aria-busy="true" aria-label="Loading filters" />} errorTitle="Filters couldn't load">
        <AnalysisBar filters={filters} update={update} reset={() => setFilters(EMPTY)} />
      </QuerySection>
      <QuerySection fallback={<div className="surface mt-6 h-32 animate-pulse bg-muted" aria-busy="true" aria-label="Loading key figures" />} errorTitle="Key figures couldn't load">
        <KpiBand filters={filters} />
      </QuerySection>
      <section className="surface mt-6 px-5 py-5" aria-labelledby="trend-title">
        <ChartTitle id="trend-title" title="Monthly spend" filters={filters} />
        <QuerySection fallback={<div className="mt-6 h-72 animate-pulse bg-muted" aria-busy="true" aria-label="Loading monthly chart" />} errorTitle="The monthly chart couldn't load">
          <MonthlyChart filters={filters} update={update} />
        </QuerySection>
      </section>
      <section className="surface mt-6 px-5 py-5" aria-labelledby="waterfall-title">
        <ChartTitle id="waterfall-title" title="From budget to landing" filters={filters} />
        <QuerySection fallback={<div className="mt-6 h-72 animate-pulse bg-muted" aria-busy="true" aria-label="Loading waterfall" />} errorTitle="The variance waterfall couldn't load">
          <Waterfall filters={filters} update={update} />
        </QuerySection>
      </section>
    </PageContainer>
  );
}

function ChartTitle({ id, title, filters }: { id: string; title: string; filters: BudgetFilters }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-xl font-normal">{title}</h2>
      <p className="eyebrow text-muted-foreground" aria-live="polite">{sliceLabel(filters)}</p>
    </div>
  );
}

/* ---------- Analysis bar: one filter state for the page ---------- */

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] border border-forest bg-card px-2 py-1 text-sm font-medium text-forest">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className={`${focusRing} ml-1 rounded-[2px] p-0.5 hover:bg-secondary`}>
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}

function SelectField({ label, value, options, allLabel, onChange }: { label: string; value: string | null; options: string[]; allLabel: string; onChange: (v: string | null) => void }) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${focusRing} mt-1 w-full rounded-[2px] border border-input bg-card px-3 py-2 text-sm`}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function AnalysisBar({ filters, update, reset }: { filters: BudgetFilters; update: (p: Partial<BudgetFilters>) => void; reset: () => void }) {
  const { data } = useSuspenseQuery(trendQueryOptions);
  const active = filters.category || filters.department || filters.month || filters.component || filters.period !== "fy_landing";
  const periodBtn = (v: WaterfallScope) => {
    const checked = !filters.month && filters.period === v;
    return (
      <button
        key={v}
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={() => update({ period: v, month: null })}
        className={`${focusRing} rounded-[2px] border px-3 py-2 text-sm ${checked ? "border-forest bg-forest text-ivory" : "border-input bg-card text-foreground hover:bg-secondary"}`}
      >
        {PERIOD_LABEL[v]}
      </button>
    );
  };
  return (
    <section className="surface mt-6 px-5 py-4" aria-label="Analysis filters">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <SelectField label="Category" value={filters.category} options={optionsOf(data, "category")} allLabel="All categories" onChange={(v) => update({ category: v })} />
        <SelectField label="Department" value={filters.department} options={optionsOf(data, "owner_department")} allLabel="All departments" onChange={(v) => update({ department: v })} />
        <div>
          <span className="eyebrow text-muted-foreground">Period</span>
          <div role="radiogroup" aria-label="Period" className="mt-1 flex flex-wrap gap-2">
            {periodBtn("fy_landing")}
            {periodBtn("ytd")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3" aria-live="polite">
        <span className="eyebrow text-muted-foreground">Active</span>
        {!active && <span className="text-sm text-muted-foreground">All categories · All departments · {PERIOD_LABEL.fy_landing}</span>}
        {filters.category && <Chip label={`Category: ${filters.category}`} onRemove={() => update({ category: null })} />}
        {filters.department && <Chip label={`Department: ${filters.department}`} onRemove={() => update({ department: null })} />}
        {filters.month && <Chip label={`Month: ${fullMonth(filters.month)}`} onRemove={() => update({ month: null })} />}
        {!filters.month && filters.period === "ytd" && <Chip label={`Period: ${PERIOD_LABEL.ytd}`} onRemove={() => update({ period: "fy_landing" })} />}
        {filters.component && <Chip label={`Component: ${COMPONENT_LABEL[filters.component]}`} onRemove={() => update({ component: null })} />}
        {active && (
          <button type="button" onClick={reset} className={`${focusRing} text-sm font-medium text-forest underline underline-offset-2`}>
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- KPI band ---------- */

function useTotals(filters: BudgetFilters): { totals: SplitTotals; rows: ReturnType<typeof periodRows> } {
  const { data } = useSuspenseQuery(monthlyVarianceQueryOptions);
  const rows = periodRows(data, filters);
  return { totals: sumSplit(rows), rows };
}

function Kpi({ title, value, sub, active }: { title: string; value: string; sub?: ReactNode; active?: boolean }) {
  return (
    <div className={`min-w-0 bg-card px-4 py-4 ${active ? "outline outline-2 -outline-offset-2 outline-forest" : ""}`}>
      <p className="text-sm font-medium text-forest/80">{title}{active && <span className="sr-only"> (selected)</span>}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-forest">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function KpiBand({ filters }: { filters: BudgetFilters }) {
  const { totals, rows } = useTotals(filters);
  if (rows.length === 0) return <p className="surface mt-6 px-5 py-5 text-sm text-muted-foreground">No spend or budget for this selection.</p>;
  const variance = Math.round((totals.landing - totals.budget) * 100) / 100;
  const pct = totals.budget === 0 ? null : variance / totals.budget;
  const share = (v: number) => (variance === 0 ? "—" : `${Math.round((v / variance) * 100)}% of the variance`);
  const c = filters.component;
  return (
    <section aria-label={`Key figures, ${sliceLabel(filters)}`} className="surface mt-6 grid grid-cols-2 gap-px overflow-hidden bg-border md:grid-cols-3 lg:grid-cols-6">
      <Kpi title="Budget" value={formatBrlKpi(totals.budget)} active={c === "budget"} />
      <Kpi title="Landing" value={formatBrlKpi(totals.landing)} active={c === "landing"} sub={filters.period === "fy_landing" && !filters.month ? "Actuals + forecast" : undefined} />
      <Kpi
        title="Variance"
        value={signed(variance)}
        sub={<>{formatPercentOrDash(pct, true)} · {variance > 0 ? "Over budget" : variance < 0 ? "Under budget" : "On budget"}</>}
      />
      <Kpi title="Price" value={signed(totals.price)} active={c === "price"} sub={share(totals.price)} />
      <Kpi title="Volume" value={signed(totals.volume)} active={c === "volume"} sub={share(totals.volume)} />
      <Kpi title="Unbudgeted" value={signed(totals.unbudgeted)} active={c === "unbudgeted"} sub={share(totals.unbudgeted)} />
    </section>
  );
}

/* ---------- Monthly chart ---------- */

function MonthlyChart({ filters, update }: { filters: BudgetFilters; update: (p: Partial<BudgetFilters>) => void }) {
  const { data: trend } = useSuspenseQuery(trendQueryOptions);
  const { data: variance } = useSuspenseQuery(monthlyVarianceQueryOptions);
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);
  const fyMonths = [...new Set(variance.filter((r) => r.scope === "fy_landing").map((r) => r.month))].sort();
  const selectMonth = (m: string | null) => update({ month: m && fyMonths.includes(m) ? m : null });

  const monthPicker = (
    <label className="text-sm">
      <span className="sr-only">Month</span>
      <select
        value={filters.month ?? ""}
        onChange={(e) => selectMonth(e.target.value || null)}
        className={`${focusRing} rounded-[2px] border border-input bg-card px-2 py-1 text-sm`}
        aria-label="Select a fiscal-year month"
      >
        <option value="">All months</option>
        {fyMonths.map((m) => <option key={m} value={m}>{fullMonth(m)}</option>)}
      </select>
    </label>
  );

  const c = filters.component;
  if (c) {
    const series = componentByMonth(variance, filters, c);
    const isChange = c === "price" || c === "volume" || c === "unbudgeted";
    return (
      <>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            {COMPONENT_LABEL[c]} by month, fiscal year {kpis.fiscal_year}{isChange ? " · contribution to the variance" : ""}. Lighter bars are forecast.
          </p>
          {monthPicker}
        </div>
        <div className="mt-3 h-72" role="img" aria-label={`${COMPONENT_LABEL[c]} by month in BRL million`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 20, right: 8, bottom: 4, left: 0 }} onClick={(s) => s?.activeLabel && selectMonth(String(s.activeLabel))}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={44} label={{ value: "BRL M", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <ReferenceLine y={0} stroke={FOREST} />
              <Tooltip formatter={(v: number) => [formatBrlFull(v), COMPONENT_LABEL[c]]} labelFormatter={(l: string) => fullMonth(l)} />
              <Bar dataKey="value" isAnimationActive={false} cursor="pointer">
                {series.map((p) => (
                  <Cell
                    key={p.month}
                    fill={p.month === filters.month ? BRONZE : isChange ? (p.is_forecast ? SAGE : FOREST) : p.is_forecast ? SAGE : FOREST}
                    fillOpacity={p.is_forecast ? 0.6 : 1}
                  />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v: number) => (isChange ? signed(v) : formatBrlKpi(v))} style={{ fontSize: 10, fill: "var(--foreground)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  }

  const points = monthlySeries(filterRows(trend, filters.category ? [filters.category] : [], filters.department ? [filters.department] : []));
  const asOf = lastActualMonth(points);
  if (points.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No spend for this selection.</p>;
  const lastIndex = (key: "actual" | "forecastLine" | "budget") => {
    for (let i = points.length - 1; i >= 0; i--) if (points[i]![key] !== null) return i;
    return -1;
  };
  const endLabel = (key: "actual" | "forecastLine" | "budget", text: string, color: string) =>
    function EndLabel(props: { x?: number; y?: number; index?: number }) {
      if (props.index !== lastIndex(key) || props.x === undefined || props.y === undefined) return <g />;
      return <text x={props.x - 4} y={props.y - 8} textAnchor="end" fontSize={11} fill={color}>{text}</text>;
    };
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
          <span className="flex items-center gap-2"><span className="h-0.5 w-6 bg-forest" />Actual</span>
          <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-dashed border-forest" />Forecast</span>
          <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-dotted border-sage" />Budget</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Select a 2026 month:</span>
          {monthPicker}
        </div>
      </div>
      <div className="mt-3 h-72" role="img" aria-label="Monthly actual, forecast and budget spend in BRL million">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 22, right: 12, bottom: 4, left: 0 }}
            onClick={(s) => s?.activeLabel && selectMonth(String(s.activeLabel))}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={18} />
            <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={44} domain={[0, "auto"]} label={{ value: "BRL M", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, name: string) => [formatBrlFull(v), name === "forecastLine" ? "Forecast" : name === "actual" ? "Actual" : "Budget"]}
              labelFormatter={(l: string) => fullMonth(l)}
            />
            {asOf && <ReferenceLine x={asOf} stroke={FOREST} strokeDasharray="2 3" label={{ value: `As of ${formatDate(kpis.anchor_date)}`, position: "top", fontSize: 11, fill: FOREST }} />}
            {filters.month && <ReferenceLine x={filters.month} stroke={BRONZE} strokeWidth={10} strokeOpacity={0.25} />}
            <Line type="monotone" dataKey="budget" stroke={SAGE} strokeWidth={2} strokeDasharray="2 4" dot={false} isAnimationActive={false} label={endLabel("budget", "Budget", SAGE)} />
            <Line type="monotone" dataKey="actual" stroke={FOREST} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5, cursor: "pointer" }} isAnimationActive={false} label={endLabel("actual", "Actual", FOREST)} />
            <Line type="monotone" dataKey="forecastLine" stroke={FOREST} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 5, cursor: "pointer" }} isAnimationActive={false} label={endLabel("forecastLine", "Forecast", FOREST)} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Click a point in 2026, or use the month menu, to see that month's variance below.</p>
    </>
  );
}

/* ---------- Waterfall ---------- */

const STEP_COMPONENT: Record<WaterfallStep["step"], Component> = { Budget: "budget", Price: "price", Volume: "volume", Unbudgeted: "unbudgeted", Landing: "landing" };

function stepLabel(s: WaterfallStep): string {
  return s.kind === "total" ? formatBrlKpi(s.amount) : signed(s.amount);
}

function Waterfall({ filters, update }: { filters: BudgetFilters; update: (p: Partial<BudgetFilters>) => void }) {
  const { totals, rows } = useTotals(filters);
  if (rows.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No variance for this selection.</p>;
  const steps = stepsFromTotals(totals);
  const active = filters.component;
  const toggle = (c: Component) => update({ component: active === c ? null : c });
  const bars = steps.map((s) => ({ ...s, base: Math.min(s.from, s.to), size: Math.abs(s.to - s.from), label: stepLabel(s) }));
  const changes = steps.filter((s) => s.kind === "change");
  const maxAbs = Math.max(1, ...changes.map((s) => Math.abs(s.amount)));
  const split = landingSplit(rows);

  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">Price: did we pay more per unit? Volume: did we buy more? Unbudgeted: spend with no budget line.</p>
      <div className="mt-4 h-64" role="img" aria-label={steps.map((s) => `${s.step} ${stepLabel(s)}`).join(", ")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="step" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={44} domain={[0, "auto"]} label={{ value: "BRL M", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="size" stackId="w" isAnimationActive={false} cursor="pointer" onClick={(d: { step?: WaterfallStep["step"] }) => d.step && toggle(STEP_COMPONENT[d.step])}>
              {bars.map((b) => {
                const c = STEP_COMPONENT[b.step];
                const fill = active === c ? BRONZE : b.kind === "total" ? FOREST : SAGE;
                return <Cell key={b.step} fill={fill} fillOpacity={active && active !== c ? 0.45 : 1} />;
              })}
              <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: "var(--foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div role="radiogroup" aria-label="Select a waterfall step" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((s) => {
          const c = STEP_COMPONENT[s.step];
          const checked = active === c;
          return (
            <button
              key={s.step}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => toggle(c)}
              className={`${focusRing} rounded-[2px] border px-3 py-2 text-left ${checked ? "border-forest bg-secondary" : "border-border bg-card hover:bg-secondary"}`}
            >
              <span className="block text-xs text-muted-foreground">{s.step}{s.kind === "total" ? " (total)" : ""}</span>
              <span className="block font-medium tabular-nums text-forest">{stepLabel(s)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="eyebrow text-muted-foreground">Variance components, own scale from zero</p>
        <ul className="mt-2 space-y-2">
          {changes.map((s) => {
            const c = STEP_COMPONENT[s.step];
            const width = `${(Math.abs(s.amount) / maxAbs) * 50}%`;
            const Icon = s.amount > 0 ? ArrowUp : s.amount < 0 ? ArrowDown : null;
            return (
              <li key={s.step} className="grid grid-cols-[5.5rem_minmax(0,1fr)_7rem] items-center gap-3 text-sm">
                <span className={`font-medium ${active === c ? "text-bronze" : "text-forest"}`}>{s.step}</span>
                <span className="relative h-3" aria-hidden="true">
                  <span className="absolute inset-y-[-4px] left-1/2 w-px bg-forest/40" />
                  <span
                    className={`absolute inset-y-0 ${active === c ? "bg-bronze" : "bg-sage"}`}
                    style={s.amount >= 0 ? { left: "50%", width } : { right: "50%", width }}
                  />
                </span>
                <span className="flex items-center justify-end gap-1 tabular-nums">
                  {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                  {signed(s.amount)}
                  <span className="sr-only">{s.amount > 0 ? " over" : s.amount < 0 ? " under" : ""}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {active === "landing" && (
        <p className="mt-4 text-sm" aria-live="polite">
          Landing = actuals to date <span className="font-medium tabular-nums text-forest">{formatBrlKpi(split.actual)}</span> + forecast{" "}
          <span className="font-medium tabular-nums text-forest">{formatBrlKpi(split.forecast)}</span>.
        </p>
      )}
      {active === "budget" && <p className="mt-4 text-sm" aria-live="polite">Budget by month is shown in the monthly chart above.</p>}
    </>
  );
}
