# Hackathon log

- **Project:** RecallReady
- **Event:** Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, and AgentMail
- **What it does:** Turns household receipts into a shared product inventory, monitors official recall sources, and guides families from a verified safety match to resolution.
- **Live app:** not deployed
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, full text search, queries, mutations, actions, HTTP actions, realtime queries
- **Auth:** none
- **AI models:** gpt-5-mini
- **Started:** 2026-09-19T22:18:23Z
- **Last updated:** 2026-09-19T23:01:02Z

## Log

### 2026-09-19 - working tree
Designed and built the RecallReady consumer experience with a rotating visual landing page, protected home overview, product inventory, receipt import flow, activity history, and guided recall resolution. The responsive React frontend uses Convex realtime queries for live household state (`src/App.tsx`, `src/styles.css`).

Added a normalized Convex data model for households, members, products, recalls, matches, activity events, source runs, and inbound email events. Implemented indexed queries, mutations, exact model evidence, idempotent demo setup, resolution tracking, and product full text search (`convex/schema.ts`, `convex/households.ts`, `convex/products.ts`, `convex/dashboard.ts`, `convex/recalls.ts`).

Connected the sponsor workflow end to end. Firecrawl actions retrieve official recall pages, OpenAI extracts product details from receipt text, and AgentMail endpoints support inbound receipt webhooks and outbound safety alerts. Missing credentials fall back to clearly labelled demonstration behavior (`convex/integrations.ts`, `convex/http.ts`, `convex/mail.ts`).

Registered the official Convex static hosting component for the required `convex.site` deployment target. Verified Convex function preparation, the household bootstrap mutation, source scan action, TypeScript compilation, and the production Vite build (`convex/convex.config.ts`, `package.json`).
