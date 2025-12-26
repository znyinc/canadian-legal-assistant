import { useMemo } from 'react';
import { AutoTooltipText } from './LegalTermTooltip';

// Minimal terms dictionary for frontend use
const DEFAULT_TERMS = new Map([
  ['limitation', {
    term: 'Limitation Period',
    plainLanguage: 'Deadline to start legal action',
    explanation: 'The time limit within which you must start a lawsuit or file a claim. After this period expires, you generally lose the right to pursue your claim.',
    learnMoreUrl: 'https://www.ontario.ca/laws/statute/02l24',
    category: 'procedural',
  }],
  ['forum', {
    term: 'Forum',
    plainLanguage: 'Where your case is heard',
    explanation: 'The tribunal, court, or administrative body that will hear your case. Examples include Small Claims Court, the Landlord and Tenant Board (LTB), or the Human Rights Tribunal of Ontario (HRTO).',
    category: 'procedural',
  }],
  ['jurisdiction', {
    term: 'Jurisdiction',
    plainLanguage: 'Legal authority to hear a case',
    explanation: 'The legal power of a court or tribunal to hear and decide a case. This includes both the type of case (subject matter jurisdiction) and the geographic area (territorial jurisdiction).',
    category: 'procedural',
  }],
  ['evidence', {
    term: 'Evidence',
    plainLanguage: 'Proof to support your claim',
    explanation: 'Information presented to a court or tribunal to prove facts, including documents, emails, photos, witness testimony, and expert reports.',
    category: 'procedural',
  }],
  ['municipal', {
    term: 'Municipal Notice',
    plainLanguage: '10-day written notice requirement',
    explanation: 'In Ontario, before suing a municipality for property damage or personal injury, you must give written notice within 10 days of the incident describing what happened, where, and when.',
    learnMoreUrl: 'https://www.ontario.ca/laws/statute/01m25#BK266',
    category: 'procedural',
  }],
]);

interface SmartTextProps {
  text: string;
}

/**
 * Smart text component that automatically adds tooltips for legal terms.
 * Use this instead of plain text when you want inline legal term explanations.
 */
export function SmartText({ text }: SmartTextProps) {
  const terms = useMemo(() => DEFAULT_TERMS, []);
  
  return <AutoTooltipText text={text} terms={terms} />;
}
