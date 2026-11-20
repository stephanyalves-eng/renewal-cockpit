import type { ReactNode } from "react";

/** One container for every page: same max width, side margins and vertical rhythm. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">{children}</main>;
}

/** Shared page header: eyebrow, Newsreader title, one-line description and an optional active-filter area. */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="page-title mt-2 text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base text-foreground/80">{description}</p>}
      </div>
      {aside && <div className="min-w-0">{aside}</div>}
    </header>
  );
}

/** Bar above a table: count on the left, actions (e.g. Export to Excel) on the right. */
export function TableToolbar({ count, children }: { count: ReactNode; children?: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm tabular-nums text-muted-foreground">{count}</p>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
