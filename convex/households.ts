import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMember, requireText } from "./lib/auth";

export const bootstrap = mutation({
  args: { sessionToken: v.string(), mode: v.optional(v.union(v.literal("demo"), v.literal("fresh"))) },
  returns: v.object({ householdId: v.id("households"), householdName: v.string(), inboxEmail: v.string(), created: v.boolean() }),
  handler: async (ctx, args) => {
    const member = await ctx.db.query("members").withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken)).unique();
    if (member) {
      const home = await ctx.db.get(member.householdId);
      if (!home) throw new Error("Household not found");
      return { householdId: home._id, householdName: home.name, inboxEmail: home.inboxEmail, created: false };
    }
    const sessionToken = requireText(args.sessionToken, "Session token", 200);
    const timestamp = Date.now();
    const suffix = sessionToken.slice(-6).toLowerCase();
    const isFresh = args.mode === "fresh";
    const householdName = isFresh ? "My Household" : "The Morgan Home";
    const memberName = isFresh ? "Household owner" : "Alex Morgan";
    const householdId = await ctx.db.insert("households", { name: householdName, slug: `${isFresh ? "home" : "morgan"}${suffix}`, inboxEmail: `protect${suffix}@agentmail.to`, protectionSince: isFresh ? timestamp : timestamp - 15_897_600_000 });
    await ctx.db.insert("members", { householdId, sessionToken, displayName: memberName, role: "owner", joinedAt: timestamp });
    if (isFresh) return { householdId, householdName, inboxEmail: `protect${suffix}@agentmail.to`, created: true };
    const recallId = await ctx.db.insert("recalls", {
      externalId: `DEMO-CPSC-${suffix}`, agency: "U.S. CPSC", title: "CookWell countertop air fryers recalled over overheating risk",
      brands: ["CookWell"], modelNumbers: ["CW AF900", "CW AF910"], hazard: "A wiring fault can cause the unit to overheat during extended use, creating a fire hazard.",
      remedy: "Stop using the appliance, unplug it, and contact the manufacturer for a free replacement.", sourceUrl: "https://www.cpsc.gov/Recalls",
      publishedAt: timestamp - 32_400_000, crawledAt: timestamp - 1_380_000, sourceLabel: "CPSC official recall feed - demonstration fixture", isDemo: true,
    });
    const riskyProductId = await ctx.db.insert("products", {
      householdId, name: "Air Fryer Pro", brand: "CookWell", modelNumber: "CW AF900", serialNumber: "SN 2849 7712", category: "Kitchen", room: "Kitchen",
      purchaseDate: "2026-02-14", retailer: "Home & More", source: "email", status: "recalled", addedAt: timestamp - 10_540_800_000,
    });
    const demoProducts = [
      { name: "Sleep Sound Monitor", brand: "NuraNest", modelNumber: "NN S2", category: "Children", room: "Nursery", purchaseDate: "2026-05-03", retailer: "Little Finch", source: "receipt" as const, status: "clear" as const, addedAt: timestamp - 6_134_400_000 },
      { name: "Cordless Stick Vacuum", brand: "AeroHome", modelNumber: "AH V12", category: "Appliances", room: "Utility", purchaseDate: "2025-11-21", retailer: "Bright House", source: "email" as const, status: "clear" as const, addedAt: timestamp - 17_971_200_000 },
      { name: "Portable Power Bank", brand: "Voltly", modelNumber: "VP 20K", category: "Electronics", room: "Home office", retailer: "Tech Cart", source: "manual" as const, status: "review" as const, addedAt: timestamp - 1_555_200_000 },
    ];
    for (const product of demoProducts) await ctx.db.insert("products", { householdId, ...product });
    await ctx.db.insert("matches", { householdId, productId: riskyProductId, recallId, confidence: 0.99, explanation: "Exact brand and model match. CookWell CW AF900 appears in the affected model list.", status: "open", createdAt: timestamp - 1_320_000 });
    const events = [
      { type: "alert_sent" as const, title: "Safety alert delivered", detail: "Email sent with the official source and replacement steps.", createdAt: timestamp - 1_080_000 },
      { type: "match_found" as const, title: "Exact model match found", detail: "CookWell CW AF900 matched at 99% confidence.", createdAt: timestamp - 1_320_000 },
      { type: "scan_completed" as const, title: "Official sources checked", detail: "Firecrawl refreshed the latest consumer safety notices.", createdAt: timestamp - 1_380_000 },
      { type: "receipt_processed" as const, title: "Purchase email understood", detail: "OpenAI extracted the air fryer model from a forwarded receipt.", createdAt: timestamp - 10_540_800_000 },
    ];
    for (const event of events) await ctx.db.insert("events", { householdId, ...event });
    return { householdId, householdName, inboxEmail: `protect${suffix}@agentmail.to`, created: true };
  },
});

const currentValidator = v.object({
  householdId: v.id("households"),
  name: v.string(),
  inboxEmail: v.string(),
  protectionSince: v.number(),
  memberName: v.string(),
  memberEmail: v.optional(v.string()),
});

export const current = query({
  args: { sessionToken: v.string() },
  returns: v.union(v.null(), currentValidator),
  handler: async (ctx, args) => {
    const member = await ctx.db.query("members").withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken)).unique();
    if (!member) return null;
    const home = await ctx.db.get(member.householdId);
    return home ? { householdId: home._id, name: home.name, inboxEmail: home.inboxEmail, protectionSince: home.protectionSince, memberName: member.displayName, memberEmail: member.email } : null;
  },
});

export const updateProfile = mutation({
  args: { sessionToken: v.string(), name: v.string(), memberName: v.string(), memberEmail: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await requireMember(ctx, args.sessionToken);
    const name = requireText(args.name, "Household name", 80);
    const memberName = requireText(args.memberName, "Member name", 80);
    const memberEmail = args.memberEmail?.trim().toLowerCase() || undefined;
    if (memberEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)) throw new Error("Enter a valid email address");
    await ctx.db.patch(member.householdId, { name });
    await ctx.db.patch(member._id, { displayName: memberName, email: memberEmail });
    return null;
  },
});

export const authorize = internalQuery({
  args: { sessionToken: v.string() },
  returns: v.object({ householdId: v.id("households"), memberEmail: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const member = await requireMember(ctx, args.sessionToken);
    return { householdId: member.householdId, memberEmail: member.email };
  },
});
