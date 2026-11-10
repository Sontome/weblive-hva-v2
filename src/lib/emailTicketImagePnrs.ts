/** The image dialog handoff is limited to three six-character codes (20 characters with spaces). */
export function getEmailTicketImagePnrs(pnrs: readonly string[]): string | null {
  if (pnrs.length < 1 || pnrs.length > 3) return null;
  const normalized = pnrs.map((pnr) => pnr.trim().toUpperCase());
  if (normalized.some((pnr) => !/^[A-Z0-9]{6}$/.test(pnr))) return null;
  const input = normalized.join(' ');
  return input.length <= 20 ? input : null;
}
