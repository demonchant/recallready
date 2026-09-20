import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  households: defineTable({ name: v.string(), slug: v.string(), inboxEmail: v.string(), protectionSince: v.number() })
    .index("by_slug", ["slug"])
    .index("by_inbox_email", ["inboxEmail"]),
  members: defineTable({
    householdId: v.id("households"), sessionToken: v.string(), displayName: v.string(), email: v.optional(v.string()),
    role: v.union(v.literal("owner"), v.literal("member")), joinedAt: v.number(),
  }).index("by_session", ["sessionToken"]).index("by_household", ["householdId"]),
  products: defineTable({
    householdId: v.id("households"), name: v.string(), brand: v.string(), modelNumber: v.string(), serialNumber: v.optional(v.string()),
    category: v.string(), room: v.string(), purchaseDate: v.optional(v.string()), retailer: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("receipt"), v.literal("email"), v.literal("demo")),
    status: v.union(v.literal("clear"), v.literal("review"), v.literal("recalled")), addedAt: v.number(),
  }).index("by_household", ["householdId"]).index("by_household_status", ["householdId", "status"]).searchIndex("search_products", { searchField: "name", filterFields: ["householdId", "status"] }),
  recalls: defineTable({
    externalId: v.string(), agency: v.string(), title: v.string(), brands: v.array(v.string()), modelNumbers: v.array(v.string()),
    hazard: v.string(), remedy: v.string(), sourceUrl: v.string(), publishedAt: v.number(), crawledAt: v.number(), sourceLabel: v.string(), isDemo: v.boolean(),
  }).index("by_external_id", ["externalId"]).index("by_published_at", ["publishedAt"]),
  matches: defineTable({
    householdId: v.id("households"), productId: v.id("products"), recallId: v.id("recalls"), confidence: v.number(), explanation: v.string(),
    status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")), createdAt: v.number(), resolvedAt: v.optional(v.number()),
  })
    .index("by_household", ["householdId"])
    .index("by_product", ["productId"])
    .index("by_recall", ["recallId"])
    .index("by_product_recall", ["productId", "recallId"]),
  events: defineTable({
    householdId: v.id("households"),
    type: v.union(v.literal("product_added"), v.literal("product_updated"), v.literal("product_removed"), v.literal("receipt_processed"), v.literal("scan_completed"), v.literal("match_found"), v.literal("alert_sent"), v.literal("match_resolved")),
    title: v.string(), detail: v.string(), createdAt: v.number(),
  }).index("by_household_created", ["householdId", "createdAt"]),
  sourceRuns: defineTable({
    householdId: v.id("households"), provider: v.union(v.literal("firecrawl"), v.literal("demo")), sourceUrl: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")), recordsFound: v.number(), startedAt: v.number(), completedAt: v.optional(v.number()), error: v.optional(v.string()),
  }).index("by_household_started", ["householdId", "startedAt"]),
  inboundEmails: defineTable({
    eventId: v.string(), inboxId: v.string(), householdId: v.optional(v.id("households")), sender: v.string(), subject: v.string(), body: v.string(),
    status: v.union(v.literal("received"), v.literal("processing"), v.literal("completed"), v.literal("failed")), receivedAt: v.number(),
    processedAt: v.optional(v.number()), error: v.optional(v.string()),
  }).index("by_event_id", ["eventId"]),
});
