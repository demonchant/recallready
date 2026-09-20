# RecallReady social launch copy

Attach `demo/RecallReady-Hackathon-Demo.mp4` directly to the post for the strongest reach.

## LinkedIn post

A recalled product can sit inside a home for months because families are expected to remember every model they own and repeatedly search fragmented safety websites.

I built **RecallReady** to reverse that burden.

Forward a real purchase email and RecallReady turns it into a living household inventory, checks official product-safety information, identifies exact model matches, and guides the family from warning to verified resolution.

The flow is real and works end to end:

1. **AgentMail** receives the household's purchase email through a dedicated inbox.
2. A signature-verified webhook routes the sender to the correct household.
3. **OpenAI** extracts the product, brand, model, retailer, category, and purchase details.
4. **Convex** stores the inventory, runs the backend functions, and synchronizes the dashboard and activity history in real time.
5. **Firecrawl** retrieves official recall-source information used by the matching workflow.
6. AgentMail can deliver the evidence-backed safety alert, while the household tracks the remedy through resolution.

This is not another recall search box. RecallReady remembers what a household owns, explains why an alert applies, links back to the authority, and keeps a permanent safety trail.

Built for the **Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, and AgentMail**.

Live product: https://whimsical-rat-205.convex.site

Public GitHub: https://github.com/demonchant/recallready

2:20 demo: https://github.com/demonchant/recallready/blob/main/demo/RecallReady-Hackathon-Demo.mp4

Thank you to the teams at Convex, OpenAI, Firecrawl, and AgentMail for creating a stack that made this consumer safety workflow possible.

@convex @OpenAI @firecrawl @agentmail

#ConvexAllGas #BuildInPublic #AI #ProductSafety #OpenAI #Firecrawl #AgentMail #Convex

## X single post

I built RecallReady: forward a purchase email and it becomes a live household inventory that watches official recalls and explains exact model matches.

Built with @convex + @OpenAI + @firecrawl + @agentmail.

Live: https://whimsical-rat-205.convex.site
Repo + 2:20 demo: https://github.com/demonchant/recallready

## X thread

### Post 1

A recalled product can sit in a home unnoticed because families are expected to remember exact model numbers and repeatedly search safety websites.

I built RecallReady so the warning finds the household instead. 🧵

### Post 2

The user forwards a real purchase email to AgentMail.

OpenAI extracts the product and exact model. Convex creates the household inventory and updates the product experience in real time.

No pasted demo data. No manual cataloging.

### Post 3

Firecrawl retrieves official product-safety information.

RecallReady matches the household's exact brand and model, then shows the authority, hazard, remedy, source evidence, and confidence behind the warning.

### Post 4

The household can send the evidence-backed alert through AgentMail and track the safety action through resolution.

Convex powers the database, functions, HTTP webhook, indexed queries, audit trail, realtime sync, and static hosting.

### Post 5

RecallReady is live for the Convex All Gas Hackathon.

Live: https://whimsical-rat-205.convex.site

Repo: https://github.com/demonchant/recallready

Demo: https://github.com/demonchant/recallready/blob/main/demo/RecallReady-Hackathon-Demo.mp4

@convex @OpenAI @firecrawl @agentmail

## Vibe Apps form

- **App Title:** RecallReady
- **Tagline:** Forward a receipt. RecallReady identifies the product, watches official recalls, and guides your household to safety.
- **Website:** https://whimsical-rat-205.convex.site
- **Video:** https://github.com/demonchant/recallready/blob/main/demo/RecallReady-Hackathon-Demo.mp4
- **GitHub:** https://github.com/demonchant/recallready
- **Screenshot:** `output/submission-images/cover.png`
- **Additional images:** `output/submission-images/integrations.png`, `output/submission-images/inventory.png`, `output/submission-images/dashboard.png`, `output/submission-images/recall-evidence.png`
- **Suggested tags:** Convex All Gas Hackathon, AI, Consumer, Safety, Email, OpenAI, Firecrawl, AgentMail

### Description

RecallReady is a household product-safety assistant that turns real purchase emails into continuous recall protection.

Consumers often miss recalls because they do not remember every model they own or repeatedly check fragmented government websites. RecallReady removes that burden: a household forwards an order confirmation to its private AgentMail inbox, OpenAI extracts the product and exact model, Convex stores and synchronizes the household inventory in real time, and Firecrawl retrieves official product-safety information for matching.

When an exact model match is found, RecallReady shows the confidence, affected model, publishing authority, hazard, official source, and recommended remedy. AgentMail can deliver the evidence-backed alert, and the household records the action through resolution.

The product uses Convex deeply: normalized tables, validators, compound indexes, full-text search, queries, mutations, actions, internal functions, signed HTTP webhook handling, realtime React subscriptions, scheduled processing, audit events, and the Convex static hosting component.

The production demonstration uses a real AgentMail message and signed webhook rather than pre-populated data. The application is publicly accessible, the repository is public, and the complete build history is documented in `hackathon.md`.
