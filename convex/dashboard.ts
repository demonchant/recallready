import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireHouseholdAccess } from "./lib/auth";

const productValidator = v.object({
  _id: v.id("products"), _creationTime: v.number(), householdId: v.id("households"), name: v.string(), brand: v.string(), modelNumber: v.string(), serialNumber: v.optional(v.string()), category: v.string(), room: v.string(), purchaseDate: v.optional(v.string()), retailer: v.optional(v.string()), source: v.union(v.literal("manual"), v.literal("receipt"), v.literal("email"), v.literal("demo")), status: v.union(v.literal("clear"), v.literal("review"), v.literal("recalled")), addedAt: v.number(),
});
const recallValidator = v.object({
  _id: v.id("recalls"), _creationTime: v.number(), externalId: v.string(), agency: v.string(), title: v.string(), brands: v.array(v.string()), modelNumbers: v.array(v.string()), hazard: v.string(), remedy: v.string(), sourceUrl: v.string(), publishedAt: v.number(), crawledAt: v.number(), sourceLabel: v.string(), isDemo: v.boolean(),
});
const matchValidator = v.object({
  _id: v.id("matches"), _creationTime: v.number(), householdId: v.id("households"), productId: v.id("products"), recallId: v.id("recalls"), confidence: v.number(), explanation: v.string(), status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")), createdAt: v.number(), resolvedAt: v.optional(v.number()), product: productValidator, recall: recallValidator,
});
const eventValidator = v.object({
  _id: v.id("events"), _creationTime: v.number(), householdId: v.id("households"), type: v.union(v.literal("product_added"), v.literal("product_updated"), v.literal("product_removed"), v.literal("receipt_processed"), v.literal("scan_completed"), v.literal("match_found"), v.literal("alert_sent"), v.literal("match_resolved")), title: v.string(), detail: v.string(), createdAt: v.number(),
});
const householdValidator = v.object({ _id: v.id("households"), _creationTime: v.number(), name: v.string(), slug: v.string(), inboxEmail: v.string(), protectionSince: v.number() });
const sourceRunValidator = v.object({ _id: v.id("sourceRuns"), _creationTime: v.number(), householdId: v.id("households"), provider: v.union(v.literal("firecrawl"), v.literal("demo")), sourceUrl: v.string(), status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")), recordsFound: v.number(), startedAt: v.number(), completedAt: v.optional(v.number()), error: v.optional(v.string()) });

export const overview = query({
  args: { sessionToken: v.string(), householdId: v.id("households") },
  returns: v.object({ household: v.union(v.null(), householdValidator), products: v.array(productValidator), matches: v.array(matchValidator), events: v.array(eventValidator), lastRun: v.union(v.null(), sourceRunValidator), stats: v.object({ protectedProducts: v.number(), openAlerts: v.number(), clearProducts: v.number(), protectionScore: v.number() }) }),
  handler: async (ctx, args) => {
    await requireHouseholdAccess(ctx, args.sessionToken, args.householdId);
    const [household, products, matches, events, sourceRuns] = await Promise.all([
      ctx.db.get(args.householdId),
      ctx.db.query("products").withIndex("by_household", (index) => index.eq("householdId", args.householdId)).take(100),
      ctx.db.query("matches").withIndex("by_household", (index) => index.eq("householdId", args.householdId)).order("desc").take(20),
      ctx.db.query("events").withIndex("by_household_created", (index) => index.eq("householdId", args.householdId)).order("desc").take(12),
      ctx.db.query("sourceRuns").withIndex("by_household_started", (index) => index.eq("householdId", args.householdId)).order("desc").take(1),
    ]);
    const enrichedMatches = [];
    for (const match of matches) {
      const product = await ctx.db.get(match.productId);
      const recall = await ctx.db.get(match.recallId);
      if (product && recall) enrichedMatches.push({ ...match, product, recall });
    }
    const openMatches = enrichedMatches.filter((match) => match.status !== "resolved");
    const clearCount = products.filter((product) => product.status === "clear").length;
    return { household, products, matches: enrichedMatches, events, lastRun: sourceRuns[0] ?? null, stats: { protectedProducts: products.length, openAlerts: openMatches.length, clearProducts: clearCount, protectionScore: products.length === 0 ? 0 : Math.max(62, Math.round(((clearCount + openMatches.length * 0.55) / products.length) * 100)) } };
  },
});

export const activity = query({
  args: { sessionToken: v.string(), householdId: v.id("households") },
  returns: v.array(eventValidator),
  handler: async (ctx, args) => {
    await requireHouseholdAccess(ctx, args.sessionToken, args.householdId);
    return await ctx.db.query("events").withIndex("by_household_created", (index) => index.eq("householdId", args.householdId)).order("desc").take(100);
  },
});
