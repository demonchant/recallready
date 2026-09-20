import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const householdByInbox = internalQuery({
  args: { inboxEmail: v.string() },
  returns: v.union(v.null(), v.id("households")),
  handler: async (ctx, args) => {
    const home = await ctx.db.query("households").withIndex("by_inbox_email", (index) => index.eq("inboxEmail", args.inboxEmail.trim().toLowerCase())).unique();
    return home?._id ?? null;
  },
});

export const recordInbound = internalMutation({
  args: { eventId: v.string(), inboxId: v.string(), householdId: v.id("households"), sender: v.string(), subject: v.string(), body: v.string() },
  returns: v.object({ accepted: v.boolean(), emailId: v.union(v.null(), v.id("inboundEmails")) }),
  handler: async (ctx, args) => {
    const duplicate = await ctx.db.query("inboundEmails").withIndex("by_event_id", (index) => index.eq("eventId", args.eventId)).unique();
    if (duplicate) return { accepted: false, emailId: duplicate._id };
    const emailId = await ctx.db.insert("inboundEmails", { ...args, status: "received", receivedAt: Date.now() });
    return { accepted: true, emailId };
  },
});

export const markStatus = internalMutation({
  args: { emailId: v.id("inboundEmails"), status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")), error: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, { status: args.status, error: args.error, processedAt: args.status === "processing" ? undefined : Date.now() });
    return null;
  },
});
