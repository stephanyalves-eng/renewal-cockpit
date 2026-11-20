import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Contract intake · Renewal Cockpit" },
      { name: "description", content: "Captures new contracts and renewal requests so they enter the review cycle on time." },
      { property: "og:title", content: "Contract intake · Renewal Cockpit" },
      { property: "og:description", content: "Captures new contracts and renewal requests so they enter the review cycle on time." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Intake" title="Contract intake" description="Captures new contracts and renewal requests so they enter the review cycle on time." emptyTitle="No submissions yet" emptyBody="Intake requests appear here once the data source is connected." />
  );
}
