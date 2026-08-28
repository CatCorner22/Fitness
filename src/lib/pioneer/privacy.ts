export type PrivacyHit = { hit: boolean; reason?: string };

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const CARD = /\b(?:\d{4}[ -]){3}\d{1,4}\b/;
const CARD_RUN = /\b\d{13,19}\b/;
const STREET =
  /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard|way|court|ct|place|pl)\b/i;
const OCTET = "(?:25[0-5]|2[0-4]\\d|1?\\d{1,2})";
const IP = new RegExp(`(?<![\\d.])${OCTET}(?:\\.${OCTET}){3}(?![\\d.])`);
const NAMED = /\b(?:my name is|i am|i'm)\s+[A-Z][a-z]{2,}\b/;

function wholeWord(haystack: string, needle: string) {
  const trimmed = needle.trim();
  if (trimmed.length < 3) return false;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

export function findIdentifyingInfo(text: string, extraNames: string[] = []): PrivacyHit {
  if (EMAIL.test(text)) return { hit: true, reason: "email" };
  if (PHONE.test(text)) return { hit: true, reason: "phone" };
  if (SSN.test(text)) return { hit: true, reason: "ssn" };
  if (STREET.test(text)) return { hit: true, reason: "address" };
  if (IP.test(text)) return { hit: true, reason: "ip" };
  if (NAMED.test(text)) return { hit: true, reason: "name" };
  if (CARD.test(text) || CARD_RUN.test(text)) return { hit: true, reason: "card" };
  for (const name of extraNames) {
    if (wholeWord(text, name)) return { hit: true, reason: "name" };
  }
  return { hit: false };
}
