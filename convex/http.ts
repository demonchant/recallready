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

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifyAgentMailSignature(request: Request, body: string, secret: string) {
  const messageId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatures = request.headers.get("svix-signature");
  if (!messageId || !timestamp || !signatures) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false;
  const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${messageId}.${timestamp}.${body}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return signatures.split(" ").some((candidate) => candidate.startsWith("v1,") && constantTimeEqual(candidate.slice(3), expected));
}

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;
    if (!expectedSecret) return new Response("Webhook is not configured", { status: 503 });
    const bodyText = await request.text();
    if (!(await verifyAgentMailSignature(request, bodyText, expectedSecret))) return new Response("Invalid webhook signature", { status: 401 });
    let payload: unknown;
    try {
      payload = JSON.parse(bodyText) as unknown;
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
