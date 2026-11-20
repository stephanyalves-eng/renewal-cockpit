import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget vs. actual · Renewal Cockpit" },
      { name: "description", content: "Tracks committed and actual spend against the fiscal-year budget, by category and month." },
      { property: "og:title", content: "Budget vs. actual · Renewal Cockpit" },
      { property: "og:description", content: "Tracks committed and actual spend against the fiscal-year budget, by category and month." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Budget" title="Budget vs. actual" description="Tracks committed and actual spend against the fiscal-year budget, by category and month." emptyTitle="No budget data yet" emptyBody="Budget lines and actuals appear here once the data source is connected." />
  );
}
