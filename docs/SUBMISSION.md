# Submission copy

## Product name

RecallReady

## One line

RecallReady turns household receipts into a living product inventory that finds verified recalls and guides families to a safe resolution.

## Short description

Consumers miss product recalls because they do not remember exact model numbers or revisit fragmented government sites. RecallReady lets a household forward purchase emails to a private AgentMail inbox. OpenAI extracts each product and model, Convex keeps the shared inventory and activity live, Firecrawl retrieves official recall notices, and AgentMail delivers evidence backed alerts. Every match shows why it fired, links to the authority, and tracks the remedy through resolution.

## Why people would use it this week

There is no new behavior to learn. People already receive receipts and order confirmations. Forwarding one email creates lasting protection for that purchase, while the shared home view helps partners, parents, and caregivers coordinate action.

## Sponsor stack

- **Convex:** primary database, indexed household model, mutations, actions, HTTP webhook, realtime subscriptions, audit events, and static frontend hosting.
- **OpenAI:** strict schema extraction of product identity from messy receipt and order text.
- **Firecrawl:** retrieval of official recall pages with durable source run evidence.
- **AgentMail:** private receipt inbox, inbound message webhook, and outbound safety alerts.

## Differentiation

RecallReady is not another recall search box. It remembers what a household owns, keeps watching after the first interaction, explains every match, and closes the loop from warning to completed remedy.

## Social post draft

We built RecallReady for the Convex All Gas Hackathon.

Forward a purchase receipt. RecallReady identifies the exact product, watches official safety notices, and gives your household a verified action when a model is recalled.

Powered by Convex, OpenAI, Firecrawl, and AgentMail.

Live demo: [add live URL]
Demo video: [add video URL]

@convex @OpenAI @firecrawl @agentmail

## Final checklist

- [ ] Public `convex.site` URL
- [ ] Public GitHub repository
- [x] `hackathon.md` at repository root
- [x] Convex static hosting configured
- [x] Production build passes
- [x] Zero known npm vulnerabilities
- [ ] Sponsor credentials configured on the production Convex deployment
- [ ] AgentMail webhook registered
- [ ] Demo video under three minutes
- [ ] Social post published and linked
- [ ] Submitted at the official judging URL before the deadline
