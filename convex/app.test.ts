/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { readOpenAIOutputText } from "./integrations";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("RecallReady Convex backend", () => {
  it("reads structured output from the raw OpenAI Responses REST payload", () => {
    expect(readOpenAIOutputText({
      output: [{ content: [{ type: "output_text", text: '{"name":"Kettle"}' }] }],
    })).toBe('{"name":"Kettle"}');
  });

  it("bootstraps one household per browser session", async () => {
    const test = convexTest(schema, modules);
    const first = await test.mutation(api.households.bootstrap, { sessionToken: "session-bootstrap-123456" });
    const second = await test.mutation(api.households.bootstrap, { sessionToken: "session-bootstrap-123456" });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.householdId).toBe(first.householdId);

    const current = await test.query(api.households.current, { sessionToken: "session-bootstrap-123456" });
    expect(current?.name).toBe("The Morgan Home");
    expect(current?.householdId).toBe(first.householdId);
  });

  it("creates an empty household for a real user start", async () => {
    const test = convexTest(schema, modules);
    const sessionToken = "session-fresh-123456";
    const home = await test.mutation(api.households.bootstrap, { sessionToken, mode: "fresh" });
    const overview = await test.query(api.dashboard.overview, { sessionToken, householdId: home.householdId });

    expect(home.householdName).toBe("My Household");
    expect(home.inboxEmail).toBe("provisioning@recallready.invalid");
    expect(overview.products).toHaveLength(0);
    expect(overview.matches).toHaveLength(0);
  });

  it("routes AgentMail receipts by the sender email saved on the household", async () => {
    const test = convexTest(schema, modules);
    const sessionToken = "session-email-routing-123456";
    const home = await test.mutation(api.households.bootstrap, { sessionToken, mode: "fresh" });
    await test.mutation(api.households.updateProfile, {
      sessionToken,
      name: "Email Routed Home",
      memberName: "Jordan Morgan",
      memberEmail: "jordan@example.com",
    });

    expect(await test.query(internal.mail.householdBySender, { senderEmail: "JORDAN@example.com" })).toBe(home.householdId);
  });

  it("rejects cross-household product access", async () => {
    const test = convexTest(schema, modules);
    const first = await test.mutation(api.households.bootstrap, { sessionToken: "session-first-123456" });
    await test.mutation(api.households.bootstrap, { sessionToken: "session-second-654321" });

    await expect(test.query(api.products.list, { sessionToken: "session-second-654321", householdId: first.householdId })).rejects.toThrow("Household access denied");
  });

  it("supports adding, editing, and removing a protected product", async () => {
    const test = convexTest(schema, modules);
    const sessionToken = "session-products-123456";
    const home = await test.mutation(api.households.bootstrap, { sessionToken, mode: "fresh" });
    const productId = await test.mutation(api.products.add, {
      sessionToken,
      householdId: home.householdId,
      name: "Coffee maker",
      brand: "Brew Safe",
      modelNumber: "BS 100",
      category: "Kitchen",
      room: "Kitchen",
    });

    await test.mutation(api.products.update, {
      sessionToken,
      productId,
      name: "Coffee maker",
      brand: "Brew Safe",
      modelNumber: "BS 101",
      category: "Kitchen",
      room: "Breakfast nook",
    });
    expect((await test.query(api.products.get, { sessionToken, productId }))?.modelNumber).toBe("BS 101");

    await test.mutation(api.products.remove, { sessionToken, productId });
    expect(await test.query(api.products.get, { sessionToken, productId })).toBeNull();
  });

  it("creates one exact-model match and keeps matching idempotent", async () => {
    const test = convexTest(schema, modules);
    const sessionToken = "session-matcher-123456";
    const home = await test.mutation(api.households.bootstrap, { sessionToken, mode: "fresh" });
    await test.mutation(api.products.add, {
      sessionToken,
      householdId: home.householdId,
      name: "Test toaster",
      brand: "SafeHeat",
      modelNumber: "SH-T10",
      category: "Kitchen",
      room: "Kitchen",
    });
    await test.run(async (ctx) => {
      await ctx.db.insert("recalls", {
        externalId: "TEST-RECALL-1",
        agency: "Test Authority",
        title: "Test toaster recall",
        brands: ["SafeHeat"],
        modelNumbers: ["SH T10"],
        hazard: "Test hazard",
        remedy: "Stop use",
        sourceUrl: "https://example.com/recall",
        publishedAt: Date.now(),
        crawledAt: Date.now(),
        sourceLabel: "Test fixture",
        isDemo: true,
      });
    });

    expect(await test.mutation(internal.integrations.matchHouseholdProducts, { householdId: home.householdId })).toBe(1);
    expect(await test.mutation(internal.integrations.matchHouseholdProducts, { householdId: home.householdId })).toBe(0);
    const overview = await test.query(api.dashboard.overview, { sessionToken, householdId: home.householdId });
    expect(overview.matches.some((match) => match.product.modelNumber === "SH-T10")).toBe(true);
  });

  it("locks resolution actions in the public guided demo", async () => {
    const test = convexTest(schema, modules);
    const sessionToken = "session-resolution-123456";
    const home = await test.mutation(api.households.bootstrap, { sessionToken });
    const overview = await test.query(api.dashboard.overview, { sessionToken, householdId: home.householdId });
    const match = overview.matches[0];

    await expect(test.mutation(api.recalls.setStatus, { sessionToken, matchId: match._id, status: "resolved" })).rejects.toThrow("Guided demo actions are read-only");
  });
});
