# Submission copy

## Product name

RecallReady

## One line

RecallReady turns household purchase emails into a living product inventory that finds verified recalls and guides families to a safe resolution.

## Vibe Apps tagline

Forward a receipt. RecallReady identifies the product, watches official recalls, and guides your household to safety.

## Short description

Consumers miss product recalls because they do not remember exact model numbers or revisit fragmented government sites. RecallReady lets a household forward real purchase emails to AgentMail. A signed webhook routes the sender to the correct household, OpenAI extracts each product and model, Convex keeps the inventory and activity live, Firecrawl retrieves official recall sources, and AgentMail delivers evidence-backed alerts. Every match shows why it fired, links to the authority, and tracks the remedy through resolution.

## Why people would use it this week

There is no new habit to learn. People already receive receipts and order confirmations. Forwarding one email creates lasting protection for that purchase, while the shared home view helps partners, parents, and caregivers coordinate action.

## Sponsor stack

- **Convex:** primary database, indexed household model, queries, mutations, actions, scheduled processing, signed HTTP webhook, realtime subscriptions, full-text search, audit events, and static frontend hosting.
- **OpenAI:** strict-schema extraction of product identity from real receipt and order email content.
- **Firecrawl:** live retrieval of the official CPSC recall source with durable source-run evidence and matching triggers.
- **AgentMail:** real inbound receipt delivery, signed `message.received` webhooks, sender-to-household routing, and outbound safety alerts.

## Differentiation

RecallReady is not another recall search box. It remembers what a household owns, keeps watching after the first interaction, explains every match, and closes the loop from warning to completed remedy.

## Social post draft

We built RecallReady for the Convex All Gas Hackathon.

Forward a real purchase email. RecallReady identifies the exact product, watches official safety notices, and gives your household a verified action when a model is recalled.

Powered end to end by Convex, OpenAI, Firecrawl, and AgentMail.

Live app: https://whimsical-rat-205.convex.site
Public repo: https://github.com/demonchant/recallready
Demo video: https://github.com/demonchant/recallready/blob/main/demo/RecallReady-Hackathon-Demo.mp4

@convex @OpenAI @firecrawl @agentmail

## Final checklist

- [x] Public `convex.site` URL
- [x] Public GitHub repository
- [x] `hackathon.md` at repository root
- [x] Convex static hosting configured
- [x] Production build, typecheck, lint, and automated tests pass
- [x] Zero known npm vulnerabilities
- [x] Sponsor credentials configured on the production Convex deployment
- [x] AgentMail signed webhook registered and verified with a real email round trip
- [x] OpenAI receipt extraction verified in production
- [x] Firecrawl official-source retrieval verified in production
- [x] Demo video recorded and exported at 2 minutes 20 seconds
- [x] Demo video URL added to `hackathon.md` and this document
- [ ] Social post published and linked
- [ ] Application submitted at the official judging URL before September 22, 2026 at 12:00 PM PT
