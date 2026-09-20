import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => new Response(JSON.stringify({ ok: true, service: "RecallReady" }), { status: 200, headers: { "Content-Type": "application/json" } })),
});

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;
    if (!expectedSecret) return new Response("Webhook is not configured", { status: 503 });
    if (request.headers.get("x-recallready-secret") !== expectedSecret) return new Response("Unauthorized", { status: 401 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    if (!payload || typeof payload !== "object") return new Response("Invalid payload", { status: 400 });
    const root = payload as Record<string, unknown>;
    if (root.event_type !== "message.received") return new Response("Ignored", { status: 200 });
    if (!root.message || typeof root.message !== "object") return new Response("Missing message", { status: 400 });
    const message = root.message as Record<string, unknown>;
    const body = typeof message.text === "string" ? message.text : typeof message.preview === "string" ? message.preview : "";
    const recipients = [...stringArray(message.to), ...stringArray(message.to_)];
    if (typeof message.inbox_email === "string") recipients.push(message.inbox_email);
    const inboxEmail = recipients.map((value) => value.trim().toLowerCase()).find((value) => value.includes("@"));
    if (!inboxEmail || !body.trim()) return new Response("Recipient and message text are required", { status: 400 });
    const householdId = await ctx.runQuery(internal.mail.householdByInbox, { inboxEmail });
    if (!householdId) return new Response("Unknown RecallReady inbox", { status: 404 });

    const eventId = typeof root.event_id === "string" && root.event_id.trim() ? root.event_id : crypto.randomUUID();
    const inbound = await ctx.runMutation(internal.mail.recordInbound, {
      eventId,
      inboxId: typeof message.inbox_id === "string" ? message.inbox_id : "unknown",
      householdId,
      sender: stringArray(message.from_)[0] ?? (typeof message.from === "string" ? message.from : "unknown"),
      subject: typeof message.subject === "string" ? message.subject : "Forwarded receipt",
      body,
    });
    if (inbound.accepted && inbound.emailId) {
      await ctx.scheduler.runAfter(0, internal.integrations.processInboundEmail, { emailId: inbound.emailId, householdId, body });
    }
    return new Response(inbound.accepted ? "Accepted" : "Already processed", { status: inbound.accepted ? 202 : 200 });
  }),
});

export default http;
