import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
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
import { QuerySection } from "@/components/query-section";
import { filterRows, lastActualMonth, monthlySeries, optionsOf, waterfallSteps, type WaterfallStep } from "@/lib/budget-logic";
import { getMonthlyTrend, getVarianceWaterfall } from "@/lib/budget.functions";
import type { WaterfallScope } from "@/lib/budget.types";
import { formatBrlFull, formatBrlKpi } from "@/lib/money";
import { dateParts } from "@/lib/overview-format";

const trendQueryOptions = queryOptions({ queryKey: ["budget", "trend"], queryFn: () => getMonthlyTrend() });
const waterfallQueryOptions = queryOptions({ queryKey: ["budget", "waterfall"], queryFn: () => getVarianceWaterfall() });
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
    void context.queryClient.prefetchQuery(waterfallQueryOptions);
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
const millions = (v: number) => `${(v / 1e6).toFixed(1)}`;
const monthLabel = (iso: string) => {
  const p = dateParts(iso);
  return `${p.month} ${p.year.slice(2)}`;
};

function Page() {
  const [categories, setCategories] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      <p className="eyebrow text-muted-foreground">Budget</p>
      <h1 className="page-title mt-2 text-4xl sm:text-5xl">Budget vs. actual</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{DESCRIPTION}</p>

      <QuerySection fallback={<div className="mt-8 h-24 animate-pulse bg-muted" aria-busy="true" />} errorTitle="Filters couldn't load">
        <Filters categories={categories} departments={departments} onCategories={setCategories} onDepartments={setDepartments} />
      </QuerySection>

      <section className="surface mt-6 px-5 py-5" aria-labelledby="trend-title">
        <h2 id="trend-title" className="text-xl font-normal">Monthly spend</h2>
        <p className="mt-1 text-sm text-muted-foreground">Actuals, forecast and budget · BRL million</p>
        <QuerySection fallback={<div className="mt-6 h-72 animate-pulse bg-muted" aria-busy="true" />} errorTitle="The monthly chart couldn't load">
          <TrendChart categories={categories} departments={departments} />
        </QuerySection>
      </section>

      <section className="surface mt-6 px-5 py-5" aria-labelledby="waterfall-title">
        <QuerySection fallback={<div className="mt-6 h-72 animate-pulse bg-muted" aria-busy="true" />} errorTitle="The variance waterfall couldn't load">
          <Waterfall categories={categories} departments={departments} />
        </QuerySection>
      </section>
    </main>
  );
}

/* ---------- Filters ---------- */

function ChipGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);
  const chip = (active: boolean) =>
    `${focusRing} rounded-[2px] border px-2.5 py-1 text-sm ${active ? "border-forest bg-forest text-ivory" : "border-input bg-card text-foreground hover:bg-secondary"}`;
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow text-muted-foreground">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" aria-pressed={selected.length === 0} onClick={() => onChange([])} className={chip(selected.length === 0)}>
          All
        </button>
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={selected.includes(o)} onClick={() => toggle(o)} className={chip(selected.includes(o))}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Filters(props: { categories: string[]; departments: string[]; onCategories: (v: string[]) => void; onDepartments: (v: string[]) => void }) {
  const { data } = useSuspenseQuery(trendQueryOptions);
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <ChipGroup label="Category" options={optionsOf(data, "category")} selected={props.categories} onChange={props.onCategories} />
      <ChipGroup label="Department" options={optionsOf(data, "owner_department")} selected={props.departments} onChange={props.onDepartments} />
    </div>
  );
}

/* ---------- Monthly chart ---------- */

function TrendChart({ categories, departments }: { categories: string[]; departments: string[] }) {
  const { data } = useSuspenseQuery(trendQueryOptions);
  const points = monthlySeries(filterRows(data, categories, departments));
  const today = lastActualMonth(points);
  if (points.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No data for this selection.</p>;
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-forest" />Actual</span>
        <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-forest" />Forecast</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-sage" />Budget</span>
      </div>
      <div className="mt-3 h-72" role="img" aria-label="Monthly actual, forecast and budget spend in BRL million">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={18} />
            <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={40} domain={[0, "auto"]} label={{ value: "BRL M", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, name: string) => [formatBrlFull(v), name === "forecastLine" ? "Forecast" : name === "actual" ? "Actual" : "Budget"]}
              labelFormatter={(l: string) => monthLabel(l)}
            />
            {today && <ReferenceLine x={today} stroke={FOREST} strokeDasharray="2 3" label={{ value: "Today", position: "top", fontSize: 11, fill: FOREST }} />}
            <Line type="monotone" dataKey="budget" stroke={SAGE} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="actual" stroke={FOREST} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="forecastLine" stroke={FOREST} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ---------- Waterfall ---------- */

function stepLabel(s: WaterfallStep): string {
  if (s.kind === "total") return formatBrlKpi(s.amount);
  if (s.amount === 0) return "BRL 0";
  return `${s.amount > 0 ? "+" : "-"}${formatBrlKpi(Math.abs(s.amount))}`;
}

function Waterfall({ categories, departments }: { categories: string[]; departments: string[] }) {
  const { data } = useSuspenseQuery(waterfallQueryOptions);
  const [scope, setScope] = useState<WaterfallScope>("fy_landing");
  const steps = waterfallSteps(filterRows(data, categories, departments), scope);
  const changes = steps.filter((s) => s.kind === "change");
  const largest = changes.reduce<WaterfallStep | null>((m, s) => (!m || Math.abs(s.amount) > Math.abs(m.amount) ? s : m), null);
  const bars = steps.map((s) => ({ ...s, base: Math.min(s.from, s.to), size: Math.abs(s.to - s.from), label: stepLabel(s) }));
  const scopeBtn = (v: WaterfallScope, text: string) => (
    <button type="button" role="radio" aria-checked={scope === v} onClick={() => setScope(v)}
      className={`${focusRing} rounded-[2px] px-2.5 py-1 text-sm ${scope === v ? "bg-secondary font-medium text-forest" : "text-muted-foreground hover:text-forest"}`}>
      {text}
    </button>
  );
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="waterfall-title" className="text-xl font-normal">From budget to landing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Variance split into price, volume and unbudgeted spend · BRL million</p>
        </div>
        <div role="radiogroup" aria-label="Variance scope" className="flex flex-wrap gap-1">
          {scopeBtn("fy_landing", "Full year (actuals + forecast)")}
          {scopeBtn("ytd", "Year to date")}
        </div>
      </div>

      <div className="mt-4 h-72" role="img" aria-label={steps.map((s) => `${s.step} ${stepLabel(s)}`).join(", ")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="step" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={40} domain={[0, "auto"]} label={{ value: "BRL M", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="size" stackId="w" isAnimationActive={false}>
              {bars.map((b) => (
                <Cell key={b.step} fill={b.kind === "total" ? FOREST : b.step === largest?.step ? BRONZE : SAGE} />
              ))}
              <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: "var(--foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        {changes.map((s) => {
          const Icon = s.amount > 0 ? ArrowUp : s.amount < 0 ? ArrowDown : null;
          const word = s.amount > 0 ? "Over" : s.amount < 0 ? "Under" : "No change";
          return (
            <li key={s.step} className="flex items-center gap-2 border-t border-border pt-2">
              {Icon && <Icon className={`h-4 w-4 shrink-0 ${s.amount > 0 ? "text-bronze" : "text-forest"}`} aria-hidden="true" />}
              <span className="font-medium text-forest">{s.step}</span>
              <span className="tabular-nums">{stepLabel(s)}</span>
              <span className="text-muted-foreground">{word}{s.step === largest?.step ? " · largest" : ""}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Price: did we pay more per unit? Volume: did we buy more? Unbudgeted: spend with no budget line.
      </p>
    </>
  );
}
