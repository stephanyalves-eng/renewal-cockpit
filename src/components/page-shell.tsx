import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

const nav = [
  { to: "/", label: "Overview" },
  { to: "/budget", label: "Budget vs. actual" },
  { to: "/renewals", label: "Renewals" },
  { to: "/savings", label: "Savings" },
  { to: "/intake", label: "Contract intake" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/sa-monogram.svg" alt="SA monogram" className="h-9 w-9" />
            <span className="text-lg font-semibold text-forest">Renewal Cockpit</span>
          </Link>
          <span className="eyebrow rounded-[2px] border border-sage px-2 py-0.5 text-forest">
            Synthetic data
          </span>
        </div>
        <nav className="-mx-1 flex flex-wrap gap-x-1 gap-y-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-[2px] px-2 py-1 text-muted-foreground hover:text-forest"
              activeProps={{ className: "rounded-[2px] px-2 py-1 bg-secondary text-forest font-medium" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function OwnerAuthLink() {
  const session = useSession();
  const queryClient = useQueryClient();
  const cls = "eyebrow self-start text-muted-foreground hover:text-forest focus-visible:outline-2 focus-visible:outline-forest sm:self-auto";
  if (session) {
    return (
      <button
        type="button"
        className={cls}
        onClick={async () => {
          await supabase.auth.signOut();
          void queryClient.invalidateQueries();
        }}
      >
        Sign out ({session.user.email})
      </button>
    );
  }
  return <Link to="/signin" className={cls}>Owner sign-in</Link>;
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Synthetic data. Source and method:{" "}
          <a
            href="https://github.com/stephanyalves-eng/vendor-renewal-cockpit"
            className="underline decoration-sage underline-offset-2 hover:text-forest"
            target="_blank"
            rel="noreferrer"
          >
            github.com/stephanyalves-eng/vendor-renewal-cockpit
          </a>
        </p>
        <OwnerAuthLink />
      </div>
    </footer>
  );
}

export function PageShell({
  eyebrow, title, description, emptyTitle, emptyBody,
}: { eyebrow: string; title: string; description: string; emptyTitle: string; emptyBody: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="page-title mt-2 text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{description}</p>
      <section className="surface mt-10 px-6 py-12 text-center sm:py-16">
        <p className="eyebrow text-muted-foreground">No data yet</p>
        <h2 className="mt-3 text-lg font-medium">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{emptyBody}</p>
      </section>
    </main>
  );
}
