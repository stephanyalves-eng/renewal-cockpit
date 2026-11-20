import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExportButton } from "@/components/export-button";
import { PageContainer, PageHeader, TableToolbar } from "@/components/page-layout";
import { QuerySection } from "@/components/query-section";
import type { ExportColumn } from "@/lib/export-excel";
import { humanize } from "@/lib/vendor-format";
import { getVendorList } from "@/lib/vendors.functions";
import type { VendorListRow } from "@/lib/vendors.types";

const vendorExportColumns: ExportColumn<VendorListRow>[] = [
  { header: "Vendor", value: (v) => v.vendor_name },
  { header: "Category", value: (v) => v.category },
  { header: "Status", value: (v) => humanize(v.status) },
  { header: "Recommendation", value: (v) => v.recommendation ?? "No decision due" },
];

const vendorListQuery = queryOptions({ queryKey: ["vendors"], queryFn: () => getVendorList() });
const DESCRIPTION = "Every vendor with its category, contract status and current renewal recommendation.";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Vendors · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(vendorListQuery);
  },
  component: Page,
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

function Page() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Vendors" title="Vendors" description={DESCRIPTION} />
      <QuerySection fallback={<div className="mt-8 h-96 animate-pulse bg-muted" aria-busy="true" aria-label="Loading vendors" />} errorTitle="The vendor list couldn't load">
        <VendorList />
      </QuerySection>
    </PageContainer>
  );
}

function VendorList() {
  const { data } = useSuspenseQuery(vendorListQuery);
  const [query, setQuery] = useState("");
  if (data.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No vendors.</p>;
  const q = query.trim().toLowerCase();
  const rows = q ? data.filter((v) => v.vendor_name.toLowerCase().includes(q)) : data;
  return (
    <>
    <label className="mt-6 block max-w-sm text-sm">
      <span className="eyebrow text-muted-foreground">Find a vendor</span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name"
        className={`${focusRing} mt-1 w-full rounded-[2px] border border-input bg-card px-3 py-2 text-sm`}
      />
    </label>
    <TableToolbar count={q ? `${rows.length} of ${data.length} vendors` : `${data.length} vendors`}>
      <ExportButton page="vendors" columns={vendorExportColumns} rows={rows} />
    </TableToolbar>
    <div className="surface mt-3 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Vendors ({rows.length})</caption>
        <thead className="eyebrow text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-4 py-3 font-normal">Vendor</th>
            <th className="w-40 px-4 py-3 font-normal">Status</th>
            <th className="w-40 px-4 py-3 font-normal">Recommendation</th>
            <th className="px-4 py-3 font-normal">Category</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No vendor matches "{query}".</td></tr>
          )}
          {rows.map((v) => (
            <tr key={v.vendor_id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-base font-medium">
                <Link to="/vendors/$vendorId" params={{ vendorId: v.vendor_id }} className={`${focusRing} text-forest underline decoration-sage underline-offset-2`}>
                  {v.vendor_name}
                </Link>
              </td>
              <td className="px-4 py-2.5">{humanize(v.status)}</td>
              <td className="px-4 py-2.5">{v.recommendation ? <span className="font-medium">{v.recommendation}</span> : <span className="text-muted-foreground">No decision due</span>}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{v.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
