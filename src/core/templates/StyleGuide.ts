export interface StyleCheck {
  ok: boolean;
  warnings: string[];
}

const advisoryWords = /(advise|recommend|should|must|guarantee|promise)/i;
const emotionalTone = /(outraged|furious|demand|threat)/i;

export class StyleGuide {
  rules(): string[] {
    return [
      'Use factual, restrained language; avoid advice or directives.',
      'Present multiple lawful pathways instead of a single recommendation.',
      'Cite sources with URLs and retrieval/currency dates.',
      'Redact PII (addresses, phone numbers, SIN, account numbers, DOB).',
      'Prefer neutral verbs ("indicates", "shows") over prescriptive terms ("must", "should").'
    ];
  }

  check(text: string): StyleCheck {
    const warnings: string[] = [];
    if (advisoryWords.test(text)) warnings.push('Advisory language detected; rephrase to informational tone.');
    if (emotionalTone.test(text)) warnings.push('Emotional tone detected; keep restrained and factual.');
    if (text.length > 0 && !/[\.\?\!]/.test(text)) warnings.push('Consider concise sentences with clear punctuation.');
    return { ok: warnings.length === 0, warnings };
  }
}
