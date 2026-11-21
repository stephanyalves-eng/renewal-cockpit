# Renewal Cockpit

**Live demo:** https://stephanyalves-eng-renewal-cockpit.stephany-alves.workers.dev

> **Synthetic data.** A fictional fintech with fictional vendors. The only real-world values are public
> list prices used as price benchmarks, each shown with its source and date.

The web front end of the **Vendor Spend & Renewal Cockpit**, a portfolio project in indirect procurement.
It answers three questions a procurement lead is asked every month:

1. **Will we land the fiscal year on budget?** If not, is it price, volume or spend nobody planned?
2. **Which contracts need a decision before they auto-renew?** By when, and what should we do?
3. **Where can we cut or consolidate spend?** How much is each action worth?

Data, forecast, variance split and renewal rules live in the companion repository
**[vendor-renewal-cockpit](https://github.com/stephanyalves-eng/vendor-renewal-cockpit)**, which builds
and tests every figure this app shows.

## Screenshots

![Highlights: clicking Cloud on the Overview, filtering Budget vs. actual to Cloud, and opening the most urgent renewal](https://raw.githubusercontent.com/stephanyalves-eng/vendor-renewal-cockpit/main/docs/images/highlights.gif)

| | |
| --- | --- |
| <img src="https://raw.githubusercontent.com/stephanyalves-eng/vendor-renewal-cockpit/main/docs/images/overview-filter.gif" alt="Clicking Cloud on the Overview switches every KPI to that category" width="420"> | <img src="https://raw.githubusercontent.com/stephanyalves-eng/vendor-renewal-cockpit/main/docs/images/budget-filter.gif" alt="Setting Category to Cloud updates the KPIs and the budget-to-landing waterfall" width="420"> |
| **Overview**: one click filters every number to a category | **Budget vs. actual**: budget to landing, split into price, volume and unbudgeted |
| <img src="https://raw.githubusercontent.com/stephanyalves-eng/vendor-renewal-cockpit/main/docs/images/renewals-dealstream.gif" alt="Opening Dealstream shows the decision deadline and the rule behind the recommendation" width="420"> | <img src="https://raw.githubusercontent.com/stephanyalves-eng/vendor-renewal-cockpit/main/docs/images/contract-intake.gif" alt="AI-extracted contract terms checked field by field against the contract on file" width="420"> |
| **Renewals**: decision deadline, recommendation and the rule behind it | **Contract intake**: AI-extracted terms checked field by field |

## Pages

| Page | What it shows |
| --- | --- |
| **Overview** | FY landing vs. budget, budget variance, auto-renewal exposure, savings YTD, landing by category and the urgent renewal decisions |
| **Budget vs. actual** | Monthly actuals, forecast and budget, and the budget-to-landing waterfall split into price, volume and unbudgeted spend, with category and department filters |
| **Renewals** | Every contract ending in the next 120 days with its decision deadline, recommendation and estimated annual impact; urgent deadlines flagged |
| **Vendors** | Contract terms, seat utilization, price against a public benchmark, the recommendation and the rule behind it |
| **Savings** | Negotiated savings vs. cost avoidance, kept separate |
| **Contract intake** | An AI step reads a contract PDF and extracts five renewal terms; each field is checked against the contract on file |

Every table exports to Excel with a "Synthetic data" first row.

## How it works

```
vendor-renewal-cockpit (Python)  ──▶  Supabase (Postgres views, row level security)  ──▶  this app
        tested figures                    read-only for visitors                     draws them
```

- **No business logic in the browser.** The app reads database views that are tested against the
  Python results to the cent; the front end only formats and filters them.
- **Visitors are read-only.** Reads use Supabase's public key under row level security. Status changes
  made by a visitor stay in their own browser.
- **Owner-only writes.** A signed-in owner listed in `app_admins` can change a contract status and save
  contract extractions; the database enforces this, not the UI.
- **AI extraction never runs for visitors.** The `/api/extract-contract` server route checks the session
  (401) and the admin row (403) before calling the model. Visitors see results saved from a real run.

## Built with

TanStack Start, React, Tailwind CSS, Recharts and Supabase. The app shell, Overview and Renewals were
generated with [Lovable](https://lovable.dev); the remaining pages, the Excel export and the tests were
written directly in this repository to keep Lovable credit use low.

## Run locally

Requires Node.js. The `.env` file holds only the Supabase URL and the public (publishable) key.

```sh
npm install
npm run dev     # http://localhost:8080
npm test        # unit tests for formatting, filters, waterfall, export and field checks
```
