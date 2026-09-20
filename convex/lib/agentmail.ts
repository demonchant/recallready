export function configuredAgentMailInbox() {
  return process.env.AGENTMAIL_INBOX_ID?.trim().toLowerCase() || "recallready@agentmail.to";
}
