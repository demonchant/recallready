# Hackathon log

- **Project:** RecallReady
- **Event:** Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, and AgentMail
- **What it does:** Turns household receipts into a shared product inventory, monitors official recall sources, and guides families from a verified safety match to resolution.
- **Live app:** https://whimsical-rat-205.convex.site
- **Repo:** https://github.com/demonchant/recallready
- **Frontend:** Convex static hosting
- **Convex deployment:** https://whimsical-rat-205.convex.cloud
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, full text search, queries, mutations, actions, HTTP actions, scheduled functions, realtime queries
- **Auth:** Other (browser-scoped household sessions with server-side ownership checks)
- **AI models:** gpt-5-mini
- **Started:** 2026-09-19T22:18:23Z
- **Last updated:** 2026-09-20T02:30:54Z

## Log

### 2026-09-19 - working tree
Designed and built the RecallReady consumer experience with a rotating visual landing page, protected home overview, product inventory, receipt import flow, activity history, and guided recall resolution. The responsive React frontend uses Convex realtime queries for live household state (`src/App.tsx`, `src/styles.css`).

Added a normalized Convex data model for households, members, products, recalls, matches, activity events, source runs, and inbound email events. Implemented indexed queries, mutations, exact model evidence, idempotent demo setup, resolution tracking, and product full text search (`convex/schema.ts`, `convex/households.ts`, `convex/products.ts`, `convex/dashboard.ts`, `convex/recalls.ts`).

Connected the sponsor workflow end to end. Firecrawl actions retrieve official recall pages, OpenAI extracts product details from receipt text, and AgentMail endpoints support inbound receipt webhooks and outbound safety alerts. Missing credentials fall back to clearly labelled demonstration behavior (`convex/integrations.ts`, `convex/http.ts`, `convex/mail.ts`).

Registered the official Convex static hosting component for the required `convex.site` deployment target. Verified Convex function preparation, the household bootstrap mutation, source scan action, TypeScript compilation, and the production Vite build (`convex/convex.config.ts`, `package.json`).

### 2026-09-20 - production readiness

Deployed the public frontend and Convex backend to the production `whimsical-rat-205` deployment. Added household-scoped session authorization, an empty real-user onboarding path, product CRUD, exact-model recall matching, idempotent resolution, production loading recovery, AgentMail webhook verification, and a responsive family-focused hero experience.

Verified the sponsor workflow in production: OpenAI structured receipt extraction, Firecrawl-backed source retrieval, AgentMail inbound and outbound email paths, Convex reactive inventory updates, and static hosting. Added automated backend, frontend, build, lint, typecheck, and browser journey checks. Fixed raw OpenAI Responses REST parsing by reading structured text from the response `output` array instead of relying on the SDK-only `output_text` helper.

### 2026-09-20 - working tree

Completed the real receipt workflow in production. A household registers its sender email, a real message enters AgentMail, the signed webhook routes it to the correct household, OpenAI extracts the product, and Convex updates inventory in real time. Added duplicate-sender protection and retained manual receipt import as a full product capability (`convex/http.ts`, `convex/mail.ts`, `convex/households.ts`, `convex/integrations.ts`, `src/App.tsx`).

Verified Firecrawl retrieval against the official source, the AgentMail email-to-inventory round trip, OpenAI extraction, public static hosting, production health, a public repository, zero npm vulnerabilities, and clean Convex deployment insights. Convex features exercised include indexed queries, mutations, actions, HTTP actions, scheduling, realtime subscriptions, full-text search, and the static hosting component.

## Submission status

- **Demo video:** Pending final under-three-minute recording.
- **Social post:** Pending publication.
- **Judging submission:** Pending final video and social links.
