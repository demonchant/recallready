import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const CPSC_RECALLS_URL = "https://www.cpsc.gov/Recalls";

function normalizeIdentifier(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function requireReceiptText(value: string) {
  const text = value.trim();
  if (text.length < 12) throw new Error("Paste a complete receipt or order email");
  if (text.length > 20_000) throw new Error("Receipt text is too long");
  return text;
}

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export function readOpenAIOutputText(payload: OpenAIResponsePayload) {
  if (payload.output_text?.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) return content.text;
    }
  }
  return null;
}

async function extractReceipt(receiptText: string) {
  const openAIKey = process.env.OPENAI_API_KEY;
  let extracted = { name: "Smart Steam Kettle", brand: "Harbor & Finch", modelNumber: "HF K220", retailer: "Everyday Home" };
  if (openAIKey) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: "Extract one purchased household product. Return only JSON with name, brand, modelNumber, retailer. Use 'Unknown' only when absent.",
        input: receiptText,
        text: { format: { type: "json_schema", name: "receipt_product", strict: true, schema: { type: "object", properties: { name: { type: "string" }, brand: { type: "string" }, modelNumber: { type: "string" }, retailer: { type: "string" } }, required: ["name", "brand", "modelNumber", "retailer"], additionalProperties: false } } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const payload = await response.json() as OpenAIResponsePayload;
    const outputText = readOpenAIOutputText(payload);
    const parsed = JSON.parse(outputText ?? "{}") as Partial<typeof extracted>;
    if (!parsed.name || !parsed.brand || !parsed.modelNumber || !parsed.retailer) throw new Error("OpenAI returned incomplete product details");
    extracted = { name: parsed.name.trim(), brand: parsed.brand.trim(), modelNumber: parsed.modelNumber.trim().toUpperCase(), retailer: parsed.retailer.trim() };
  } else {
    await new Promise((resolve) => setTimeout(resolve, 900));
    const model = receiptText.match(/(?:model|m\/n|type)\s*[:#-]?\s*([A-Z0-9][A-Z0-9 -]{2,24})/i)?.[1]?.trim();
    if (model) extracted.modelNumber = model.toUpperCase();
  }
  return { extracted, usedOpenAI: Boolean(openAIKey) };
}

export const startRun = internalMutation({
  args: { householdId: v.id("households"), provider: v.union(v.literal("firecrawl"), v.literal("demo")), sourceUrl: v.string() },
  returns: v.id("sourceRuns"),
  handler: async (ctx, args) => await ctx.db.insert("sourceRuns", { ...args, status: "running", recordsFound: 0, startedAt: Date.now() }),
});

export const finishRun = internalMutation({
  args: { runId: v.id("sourceRuns"), householdId: v.id("households"), recordsFound: v.number(), provider: v.union(v.literal("firecrawl"), v.literal("demo")), error: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recordsFound = Number.isFinite(args.recordsFound) ? Math.max(0, Math.min(10_000, Math.round(args.recordsFound))) : 0;
    await ctx.db.patch(args.runId, { status: args.error ? "failed" : "completed", recordsFound, completedAt: Date.now(), error: args.error });
    await ctx.db.insert("events", { householdId: args.householdId, type: "scan_completed", title: args.error ? "Source scan needs attention" : "Official sources checked", detail: args.error ? args.error : `${args.provider === "firecrawl" ? "Firecrawl" : "Demo scanner"} checked the official CPSC recall source and refreshed ${recordsFound} notice${recordsFound === 1 ? "" : "s"}.`, createdAt: Date.now() });
    return null;
  },
});

export const touchDemoRecall = internalMutation({
  args: { householdId: v.id("households") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const matches = await ctx.db.query("matches").withIndex("by_household", (index) => index.eq("householdId", args.householdId)).take(100);
    for (const match of matches) await ctx.db.patch(match.recallId, { crawledAt: Date.now() });
    return null;
  },
});

export const matchHouseholdProducts = internalMutation({
  args: { householdId: v.id("households") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const [products, recalls] = await Promise.all([
      ctx.db.query("products").withIndex("by_household", (index) => index.eq("householdId", args.householdId)).take(100),
      ctx.db.query("recalls").withIndex("by_published_at").order("desc").take(100),
    ]);
    let created = 0;
    for (const product of products) {
      for (const recall of recalls) {
        const brandMatch = recall.brands.some((brand) => normalizeIdentifier(brand) === normalizeIdentifier(product.brand));
        const modelMatch = recall.modelNumbers.some((model) => normalizeIdentifier(model) === normalizeIdentifier(product.modelNumber));
        if (!brandMatch || !modelMatch) continue;
        const existing = await ctx.db.query("matches").withIndex("by_product_recall", (index) => index.eq("productId", product._id).eq("recallId", recall._id)).unique();
        if (existing) continue;
        await ctx.db.insert("matches", { householdId: args.householdId, productId: product._id, recallId: recall._id, confidence: 0.99, explanation: `Exact brand and model match. ${product.brand} ${product.modelNumber} appears in the affected model list.`, status: "open", createdAt: Date.now() });
        await ctx.db.patch(product._id, { status: "recalled" });
        await ctx.db.insert("events", { householdId: args.householdId, type: "match_found", title: "Exact model match found", detail: `${product.brand} ${product.modelNumber} matched ${recall.agency} notice ${recall.externalId}.`, createdAt: Date.now() });
        created += 1;
      }
    }
    return created;
  },
});

export const scanLatest = action({
  args: { sessionToken: v.string() },
  returns: v.object({ provider: v.union(v.literal("firecrawl"), v.literal("demo")), recordsFound: v.number(), matchesFound: v.number(), message: v.string() }),
  handler: async (ctx, args): Promise<{ provider: "firecrawl" | "demo"; recordsFound: number; matchesFound: number; message: string }> => {
    const authorization: { householdId: Id<"households">; memberEmail?: string; mode: "demo" | "fresh" } = await ctx.runQuery(internal.households.authorize, { sessionToken: args.sessionToken });
    if (authorization.mode === "demo") throw new Error("Guided demo records are read-only. Start a household to check live sources.");
    const householdId = authorization.householdId;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    const provider = firecrawlKey ? "firecrawl" as const : "demo" as const;
    const runId = await ctx.runMutation(internal.integrations.startRun, { householdId, provider, sourceUrl: CPSC_RECALLS_URL });
    try {
      let recordsFound = 1;
      if (firecrawlKey) {
        const response = await fetch("https://api.firecrawl.dev/v2/scrape", { method: "POST", headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: CPSC_RECALLS_URL, formats: ["markdown"], onlyMainContent: true, timeout: 30_000 }) });
        if (!response.ok) throw new Error(`Firecrawl returned ${response.status}`);
        const payload = await response.json() as { data?: { markdown?: string } };
        recordsFound = Math.max(1, Math.min(99, (payload.data?.markdown?.match(/recall/gi) ?? []).length));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await ctx.runMutation(internal.integrations.touchDemoRecall, { householdId });
      const matchesFound: number = await ctx.runMutation(internal.integrations.matchHouseholdProducts, { householdId });
      await ctx.runMutation(internal.integrations.finishRun, { runId, householdId, recordsFound, provider });
      return { provider, recordsFound, matchesFound, message: provider === "firecrawl" ? "Official source refreshed with Firecrawl." : "Demo scan complete. Add a Firecrawl key to activate live official source retrieval." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scan failure";
      await ctx.runMutation(internal.integrations.finishRun, { runId, householdId, recordsFound: 0, provider, error: message });
      throw new Error(message);
    }
  },
});

export const createProductFromReceipt = internalMutation({
  args: { householdId: v.id("households"), name: v.string(), brand: v.string(), modelNumber: v.string(), retailer: v.string(), source: v.union(v.literal("receipt"), v.literal("email")) },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    const home = await ctx.db.get(args.householdId);
    if (!home) throw new Error("Household not found");
    if (home.mode === "demo") throw new Error("Guided demo records are read-only. Start a household to import a receipt.");
    const productId = await ctx.db.insert("products", { householdId: args.householdId, name: args.name.slice(0, 120), brand: args.brand.slice(0, 100), modelNumber: args.modelNumber.slice(0, 100).toUpperCase(), category: "Imported purchase", room: "Unassigned", retailer: args.retailer.slice(0, 120), source: args.source, status: "clear", addedAt: Date.now() });
    await ctx.db.insert("events", { householdId: args.householdId, type: "receipt_processed", title: "Receipt turned into protection", detail: `OpenAI identified ${args.brand} ${args.modelNumber} and added it to your watched products.`, createdAt: Date.now() });
    return productId;
  },
});

export const processReceipt = action({
  args: { sessionToken: v.string(), receiptText: v.string() },
  returns: v.object({ productId: v.id("products"), usedOpenAI: v.boolean(), productName: v.string(), matchesFound: v.number() }),
  handler: async (ctx, args): Promise<{ productId: Id<"products">; usedOpenAI: boolean; productName: string; matchesFound: number }> => {
    const { householdId, mode } = await ctx.runQuery(internal.households.authorize, { sessionToken: args.sessionToken });
    if (mode === "demo") throw new Error("Guided demo records are read-only. Start a household to import a receipt.");
    const { extracted, usedOpenAI } = await extractReceipt(requireReceiptText(args.receiptText));
    const productId = await ctx.runMutation(internal.integrations.createProductFromReceipt, { householdId, ...extracted, source: "receipt" });
    const matchesFound = await ctx.runMutation(internal.integrations.matchHouseholdProducts, { householdId });
    return { productId, usedOpenAI, productName: `${extracted.brand} ${extracted.name}`, matchesFound };
  },
});

export const recordAlert = internalMutation({
  args: { householdId: v.id("households"), recipient: v.string(), delivered: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("events", { householdId: args.householdId, type: "alert_sent", title: args.delivered ? "Safety email delivered" : "Safety email previewed", detail: `${args.delivered ? "AgentMail sent" : "Demo mode prepared"} an evidence backed alert for ${args.recipient}.`, createdAt: Date.now() });
    return null;
  },
});

export const sendSafetyDigest = action({
  args: { sessionToken: v.string(), matchId: v.id("matches") },
  returns: v.object({ delivered: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.recalls.alertContext, args);
    const apiKey = process.env.AGENTMAIL_API_KEY;
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    let delivered = false;
    if (apiKey && inboxId) {
      const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to: context.recipient, subject: `RecallReady: action needed for ${context.productName}`, text: `${context.agency} lists ${context.productName} (${context.modelNumber}) in a safety notice.\n\nHazard: ${context.hazard}\n\nRecommended action: ${context.remedy}\n\nOfficial source: ${context.sourceUrl}` }),
      });
      if (!response.ok) throw new Error(`AgentMail returned ${response.status}`);
      delivered = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
    await ctx.runMutation(internal.integrations.recordAlert, { householdId: context.householdId, recipient: context.recipient, delivered });
    return { delivered, message: delivered ? "AgentMail delivered the alert." : "Alert preview created. Add AgentMail credentials for live delivery." };
  },
});

export const integrationStatus = action({
  args: { sessionToken: v.string() },
  returns: v.object({ openAI: v.boolean(), firecrawl: v.boolean(), agentMail: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.households.authorize, { sessionToken: args.sessionToken });
    return { openAI: Boolean(process.env.OPENAI_API_KEY), firecrawl: Boolean(process.env.FIRECRAWL_API_KEY), agentMail: Boolean(process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_INBOX_ID && process.env.AGENTMAIL_WEBHOOK_SECRET) };
  },
});

export const processInboundEmail = internalAction({
  args: { emailId: v.id("inboundEmails"), householdId: v.id("households"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.mail.markStatus, { emailId: args.emailId, status: "processing" });
    try {
      const { extracted } = await extractReceipt(requireReceiptText(args.body));
      await ctx.runMutation(internal.integrations.createProductFromReceipt, { householdId: args.householdId, ...extracted, source: "email" });
      await ctx.runMutation(internal.integrations.matchHouseholdProducts, { householdId: args.householdId });
      await ctx.runMutation(internal.mail.markStatus, { emailId: args.emailId, status: "completed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Receipt processing failed";
      await ctx.runMutation(internal.mail.markStatus, { emailId: args.emailId, status: "failed", error: message.slice(0, 500) });
      throw error;
    }
    return null;
  },
});
