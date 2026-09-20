# RecallReady Hackathon Demo Voiceover

Target runtime: 2 minutes 20 seconds.

Every year, everyday products are recalled after they have already entered our homes. The problem is not finding another recall website. It is knowing whether a warning applies to the exact product your family owns, in time to act.

RecallReady turns ordinary receipts into a living household safety system. The public app is hosted on Convex, with the household inventory, backend functions, and real-time updates all running on Convex.

Here, the connected services are live. AgentMail provides the household inbox, OpenAI understands incoming purchase emails, and Firecrawl retrieves official product-safety information.

I send a real order confirmation to the private AgentMail address. RecallReady receives the email, OpenAI extracts the product, brand, model, category, purchase details, and retailer, and Convex adds that product to the household automatically. There is no manual cataloging and no pre-populated demo record.

The inbound webhook is signature verified, matched to the saved household member, and recorded as an auditable processing event. Each ingestion step updates the same typed Convex backend rather than passing data between disconnected services.

The dashboard updates in real time. RecallReady has matched this exact CookWell Air Fryer model to a safety notice, so the household immediately sees that action is required.

Because Convex queries are reactive, the inventory, protection score, alerts, and activity history update without a manual refresh. Firecrawl keeps the source evidence current while RecallReady performs exact brand and model matching.

Opening the alert shows the evidence behind the decision: a ninety-nine percent model match, the official authority, the affected model, the hazard, the remedy, and the last verification time. The family can follow the manufacturer guidance, send the alert, and record the issue as resolved.

RecallReady makes product recalls personal, verified, and actionable: from receipt, to warning, to a safer home.
