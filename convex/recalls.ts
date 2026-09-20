import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireHouseholdAccess, requireMember } from "./lib/auth";

const productValidator = v.object({
  _id: v.id("products"), _creationTime: v.number(), householdId: v.id("households"), name: v.string(), brand: v.string(), modelNumber: v.string(), serialNumber: v.optional(v.string()), category: v.string(), room: v.string(), purchaseDate: v.optional(v.string()), retailer: v.optional(v.string()), source: v.union(v.literal("manual"), v.literal("receipt"), v.literal("email"), v.literal("demo")), status: v.union(v.literal("clear"), v.literal("review"), v.literal("recalled")), addedAt: v.number(),
});
const recallValidator = v.object({
  _id: v.id("recalls"), _creationTime: v.number(), externalId: v.string(), agency: v.string(), title: v.string(), brands: v.array(v.string()), modelNumbers: v.array(v.string()), hazard: v.string(), remedy: v.string(), sourceUrl: v.string(), publishedAt: v.number(), crawledAt: v.number(), sourceLabel: v.string(), isDemo: v.boolean(),
});
const matchValidator = v.object({
  _id: v.id("matches"), _creationTime: v.number(), householdId: v.id("households"), productId: v.id("products"), recallId: v.id("recalls"), confidence: v.number(), explanation: v.string(), status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")), createdAt: v.number(), resolvedAt: v.optional(v.number()),
});
const matchDetailsValidator = v.object({ match: matchValidator, product: productValidator, recall: recallValidator });

export const getMatch = query({
  args: { sessionToken: v.string(), matchId: v.id("matches") },
  returns: v.union(v.null(), matchDetailsValidator),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    await requireHouseholdAccess(ctx, args.sessionToken, match.householdId);
    const [product, recall] = await Promise.all([ctx.db.get(match.productId), ctx.db.get(match.recallId)]);
    return product && recall ? { match, product, recall } : null;
  },
});

export const setStatus = mutation({
  args: { sessionToken: v.string(), matchId: v.id("matches"), status: v.union(v.literal("acknowledged"), v.literal("resolved")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Recall match not found");
    await requireHouseholdAccess(ctx, args.sessionToken, match.householdId);
    if (match.status === args.status || match.status === "resolved") return null;
    await ctx.db.patch(args.matchId, { status: args.status, resolvedAt: args.status === "resolved" ? Date.now() : undefined });
    if (args.status === "resolved") {
      const productMatches = await ctx.db.query("matches").withIndex("by_product", (index) => index.eq("productId", match.productId)).take(100);
      const hasOtherOpenMatch = productMatches.some((candidate) => candidate._id !== match._id && candidate.status !== "resolved");
      if (!hasOtherOpenMatch) await ctx.db.patch(match.productId, { status: "clear" });
      const product = await ctx.db.get(match.productId);
      await ctx.db.insert("events", { householdId: match.householdId, type: "match_resolved", title: "Safety issue resolved", detail: `${product?.name ?? "Product"} was marked safe after the recommended action.`, createdAt: Date.now() });
    }
    return null;
  },
});

export const alertContext = internalQuery({
  args: { sessionToken: v.string(), matchId: v.id("matches") },
  returns: v.object({ householdId: v.id("households"), recipient: v.string(), productName: v.string(), modelNumber: v.string(), agency: v.string(), hazard: v.string(), remedy: v.string(), sourceUrl: v.string() }),
  handler: async (ctx, args) => {
    const member = await requireMember(ctx, args.sessionToken);
    if (!member.email) throw new Error("Add your email address in Settings before sending an alert");
    const match = await ctx.db.get(args.matchId);
    if (!match || match.householdId !== member.householdId) throw new Error("Recall match not found");
    const [product, recall] = await Promise.all([ctx.db.get(match.productId), ctx.db.get(match.recallId)]);
    if (!product || !recall) throw new Error("Recall evidence is incomplete");
    return { householdId: member.householdId, recipient: member.email, productName: product.name, modelNumber: product.modelNumber, agency: recall.agency, hazard: recall.hazard, remedy: recall.remedy, sourceUrl: recall.sourceUrl };
  },
});
