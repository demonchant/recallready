import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireHouseholdAccess, requireText } from "./lib/auth";

const productValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  householdId: v.id("households"),
  name: v.string(),
  brand: v.string(),
  modelNumber: v.string(),
  serialNumber: v.optional(v.string()),
  category: v.string(),
  room: v.string(),
  purchaseDate: v.optional(v.string()),
  retailer: v.optional(v.string()),
  source: v.union(v.literal("manual"), v.literal("receipt"), v.literal("email"), v.literal("demo")),
  status: v.union(v.literal("clear"), v.literal("review"), v.literal("recalled")),
  addedAt: v.number(),
});

const productInput = {
  name: v.string(),
  brand: v.string(),
  modelNumber: v.string(),
  serialNumber: v.optional(v.string()),
  category: v.string(),
  room: v.string(),
  purchaseDate: v.optional(v.string()),
  retailer: v.optional(v.string()),
};

function normalizeProductInput(args: {
  name: string;
  brand: string;
  modelNumber: string;
  serialNumber?: string;
  category: string;
  room: string;
  purchaseDate?: string;
  retailer?: string;
}) {
  return {
    name: requireText(args.name, "Product name", 120),
    brand: requireText(args.brand, "Brand", 100),
    modelNumber: requireText(args.modelNumber, "Model number", 100).toUpperCase(),
    serialNumber: args.serialNumber?.trim() || undefined,
    category: requireText(args.category, "Category", 80),
    room: requireText(args.room, "Room", 80),
    purchaseDate: args.purchaseDate?.trim() || undefined,
    retailer: args.retailer?.trim() || undefined,
  };
}

export const list = query({
  args: { sessionToken: v.string(), householdId: v.id("households") },
  returns: v.array(productValidator),
  handler: async (ctx, args) => {
    await requireHouseholdAccess(ctx, args.sessionToken, args.householdId);
    return await ctx.db.query("products").withIndex("by_household", (query) => query.eq("householdId", args.householdId)).order("desc").take(100);
  },
});

export const add = mutation({
  args: { sessionToken: v.string(), householdId: v.id("households"), ...productInput },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    await requireHouseholdAccess(ctx, args.sessionToken, args.householdId);
    const home = await ctx.db.get(args.householdId);
    if (home?.mode === "demo") throw new Error("Guided demo records are read-only. Start a household to add products.");
    const product = normalizeProductInput(args);
    const productId = await ctx.db.insert("products", { householdId: args.householdId, ...product, source: "manual", status: "clear", addedAt: Date.now() });
    await ctx.db.insert("events", { householdId: args.householdId, type: "product_added", title: `${product.name} added`, detail: `${product.brand} ${product.modelNumber} is now watched for new safety notices.`, createdAt: Date.now() });
    return productId;
  },
});

export const get = query({
  args: { sessionToken: v.string(), productId: v.id("products") },
  returns: v.union(v.null(), productValidator),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    await requireHouseholdAccess(ctx, args.sessionToken, product.householdId);
    return product;
  },
});

export const update = mutation({
  args: { sessionToken: v.string(), productId: v.id("products"), ...productInput },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    await requireHouseholdAccess(ctx, args.sessionToken, product.householdId);
    const home = await ctx.db.get(product.householdId);
    if (home?.mode === "demo") throw new Error("Guided demo records are read-only. Start a household to edit products.");
    const update = normalizeProductInput(args);
    await ctx.db.patch(args.productId, update);
    await ctx.db.insert("events", { householdId: product.householdId, type: "product_updated", title: `${update.name} updated`, detail: `The product identity and location details were updated.`, createdAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    await requireHouseholdAccess(ctx, args.sessionToken, product.householdId);
    const home = await ctx.db.get(product.householdId);
    if (home?.mode === "demo") throw new Error("Guided demo records are read-only. Start a household to remove products.");
    const matches = await ctx.db.query("matches").withIndex("by_product", (query) => query.eq("productId", args.productId)).take(100);
    for (const match of matches) await ctx.db.delete(match._id);
    await ctx.db.delete(args.productId);
    await ctx.db.insert("events", { householdId: product.householdId, type: "product_removed", title: `${product.name} removed`, detail: `${product.brand} ${product.modelNumber} is no longer monitored for this household.`, createdAt: Date.now() });
    return null;
  },
});
