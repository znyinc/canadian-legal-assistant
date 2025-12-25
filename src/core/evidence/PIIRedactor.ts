export type PiiFinding = { type: 'email' | 'phone' | 'sin' | 'dob' | 'account'; match: string };
export type RedactionResult = { redacted: string; findings: PiiFinding[] };

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
// Canadian SIN patterns: 123-456-789 or 123456789 (basic pattern only)
const SIN = /\b\d{3}-\d{3}-\d{3}\b|\b\d{9}\b/g;
// DOB patterns like YYYY-MM-DD or DD/MM/YYYY
const DOB = /\b\d{4}-\d{2}-\d{2}\b|\b\d{2}\/\d{2}\/\d{4}\b/g;
// Account numbers: sequences of 8+ digits (naive)
const ACCOUNT = /\b\d{8,}\b/g;

export function redactPII(text: string): RedactionResult {
  const findings: PiiFinding[] = [];
  let redacted = text;

  redacted = replaceAndCollect(redacted, EMAIL, 'email', findings);
  redacted = replaceAndCollect(redacted, PHONE, 'phone', findings);
  redacted = replaceAndCollect(redacted, SIN, 'sin', findings);
  redacted = replaceAndCollect(redacted, DOB, 'dob', findings);
  redacted = replaceAndCollect(redacted, ACCOUNT, 'account', findings);

  return { redacted, findings };
}

function replaceAndCollect(text: string, re: RegExp, type: PiiFinding['type'], findings: PiiFinding[]) {
  return text.replace(re, (m) => {
    findings.push({ type, match: m });
    return '[REDACTED]';
  });
}
