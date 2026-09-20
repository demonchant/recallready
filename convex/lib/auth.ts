import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type DatabaseCtx = QueryCtx | MutationCtx;

export async function requireMember(ctx: DatabaseCtx, sessionToken: string) {
  const member = await ctx.db
    .query("members")
    .withIndex("by_session", (query) => query.eq("sessionToken", sessionToken))
    .unique();
  if (!member) throw new Error("Unauthorized household session");
  return member;
}

export async function requireHouseholdAccess(
  ctx: DatabaseCtx,
  sessionToken: string,
  householdId: Id<"households">,
) {
  const member = await requireMember(ctx, sessionToken);
  if (member.householdId !== householdId) throw new Error("Household access denied");
  return member;
}

export function requireText(value: string, label: string, maxLength = 160) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  if (normalized.length > maxLength) throw new Error(`${label} is too long`);
  return normalized;
}
