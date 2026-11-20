import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/renewals")({
  head: () => ({
    meta: [
      { title: "Renewals · Renewal Cockpit" },
      { name: "description", content: "Lists contracts that need a decision before their notice window closes and they auto-renew." },
      { property: "og:title", content: "Renewals · Renewal Cockpit" },
      { property: "og:description", content: "Lists contracts that need a decision before their notice window closes and they auto-renew." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Renewals" title="Renewals" description="Lists contracts that need a decision before their notice window closes and they auto-renew." emptyTitle="No contracts yet" emptyBody="Upcoming renewals and notice deadlines appear here once the data source is connected." />
  );
}
