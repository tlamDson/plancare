/**
 * VIP allowlist for Google Calendar UI (cosmetic — backend enforces VIP_EMAILS).
 * VITE_VIP_EMAILS is visible in the client bundle; do not treat as a secret.
 */

function parseVipEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Empty list in dev: show sync to everyone (matches backend VIP empty-list dev behavior).
 * Empty list in production build: nobody is VIP in UI until VITE_VIP_EMAILS is set.
 */
export function isVipUser(email?: string | null): boolean {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  const list = parseVipEmails(import.meta.env.VITE_VIP_EMAILS);
  if (list.length === 0) {
    return import.meta.env.DEV;
  }
  return list.includes(normalized);
}
