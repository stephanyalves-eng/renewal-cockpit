import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings · Renewal Cockpit" },
      { name: "description", content: "Highlights where spend can be cut, renegotiated or consolidated across overlapping vendors." },
      { property: "og:title", content: "Savings · Renewal Cockpit" },
      { property: "og:description", content: "Highlights where spend can be cut, renegotiated or consolidated across overlapping vendors." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Savings" title="Savings" description="Highlights where spend can be cut, renegotiated or consolidated across overlapping vendors." emptyTitle="No opportunities yet" emptyBody="Savings opportunities appear here once the data source is connected." />
  );
}
