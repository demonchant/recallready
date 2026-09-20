# RecallReady

RecallReady is a shared product safety assistant for ordinary households. Forward a purchase email, let AI identify the exact product and model, and stay connected to official recall notices for as long as the item remains in your home.

Built for the Convex All Gas Hackathon with Convex, OpenAI, Firecrawl, and AgentMail.

## Why it matters

Product recall systems put the burden on consumers. A person must remember the exact models they own, repeatedly search fragmented government websites, recognize a relevant notice, and work out what to do. Most people never complete that chain.

RecallReady reverses the workflow:

1. AgentMail receives forwarded receipts and order confirmations.
2. OpenAI extracts the product, brand, retailer, and model.
3. Convex stores a shared household inventory and synchronizes every update in real time.
4. Firecrawl retrieves official safety notices for matching.
5. AgentMail sends an evidence backed alert with the source and remedy.
6. The household tracks the action through resolution.

## Product surfaces

- Rotating cinematic landing page with an interactive demo entry
- Live household protection overview and score
- Searchable, filterable shared product inventory
- Dedicated manual product entry flow
- Receipt inbox and interactive OpenAI extraction flow
- Verified recall detail with match evidence and official source
- Guided remedy and resolution state
- Realtime household activity history
- Responsive navigation for desktop and mobile
- Branded loading, scan, processing, toast, and resolution feedback

## Convex depth

- Eight normalized tables with explicit validators
- Compound indexes for household scoped access
- Full text product search index
- Queries, mutations, actions, internal functions, and HTTP actions
- Live React subscriptions through `useQuery`
- Idempotent AgentMail webhook event storage
- Firecrawl source run audit records
- Official Convex static hosting component

## Run locally

```bash
npm install
npx convex dev
npm run dev
```

The product remains fully explorable in demonstration mode when sponsor credentials are absent. Demonstration data is explicitly labelled inside the recall evidence view.

## Configure integrations

Set deployment environment variables without committing their values:

```bash
npx convex env set OPENAI_API_KEY
npx convex env set FIRECRAWL_API_KEY
npx convex env set AGENTMAIL_API_KEY
npx convex env set AGENTMAIL_INBOX_ID
npx convex env set AGENTMAIL_WEBHOOK_SECRET
```

Register the AgentMail `message.received` webhook at:

```text
https://YOUR_DEPLOYMENT.convex.site/webhooks/agentmail
```

Use the custom request header `x-recallready-secret` with the configured webhook secret.

## Verify

```bash
npx convex dev --once
npm run typecheck
npm test
npm run build
npm audit
```

## Deploy

Login once, then use the official Convex static hosting deployment flow:

```bash
npx convex login
npm run deploy
```

The result is a public SPA at the deployment's `convex.site` address, with the Convex backend and frontend shipped together.

## Evidence and submission

- [Architecture](docs/ARCHITECTURE.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Submission copy](docs/SUBMISSION.md)
- [Hackathon build log](hackathon.md)

## Safety boundary

RecallReady is a product safety information tool, not an emergency service. A match is shown with its confidence, affected model evidence, source authority, and official link. The running prototype clearly identifies demonstration fixtures and does not represent them as live recalls.
