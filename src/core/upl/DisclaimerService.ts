export interface PathwayOption {
  label: string;
  steps: string[];
  caveats?: string[];
}

export interface DisclaimerContext {
  jurisdiction?: string;
  domain?: string;
  audience?: 'self-represented' | 'lawyer' | 'advocate';
}

export class DisclaimerService {
  legalInformationDisclaimer(ctx: DisclaimerContext): string {
    const jurisdiction = ctx.jurisdiction || 'Ontario (verify for your province/territory)';
    return [
      'This tool provides legal information, not legal advice.',
      `Applicability: primarily for ${jurisdiction}.`,
      'Decisions remain yours; consult a lawyer or licensed paralegal for advice.',
      'Outputs must be verified against current law and your facts.',
      'Sensitive data should be redacted before sharing.'
    ].join(' ');
  }

  multiPathwayPresentation(options: PathwayOption[]): string {
    if (!options.length) return 'No pathways available; gather more facts or seek legal advice.';
    return options
      .map((opt, i) => {
        const steps = opt.steps.map((s, idx) => `${idx + 1}. ${s}`).join(' ');
        const caveats = opt.caveats?.length ? ` Caveats: ${opt.caveats.join(' ')}` : '';
        return `${i + 1}) ${opt.label}: ${steps}.${caveats}`;
      })
      .join(' ');
  }

  redirectAdviceRequest(userText: string): { redirected: boolean; message: string } {
    const advisoryPatterns = /(what should I do|can you advise|tell me what to file|should I sue)/i;
    if (advisoryPatterns.test(userText)) {
      return {
        redirected: true,
        message:
          'I cannot provide legal advice. Here are informational options you may consider: internal complaint, tribunal/court intake, ombuds/appeal/judicial review. Confirm which applies and seek legal counsel as needed.'
      };
    }
    return { redirected: false, message: 'Proceed with information-only guidance.' };
  }

  // Empathy-focused boundary enforcement: What we CAN/CANNOT do
  empathyBoundaries = (ctx: DisclaimerContext): string => buildEmpathyBoundaries(ctx);
}

export function buildEmpathyBoundaries(ctx: DisclaimerContext): string {
  const audience = ctx.audience || 'self-represented';
  const jurisdiction = ctx.jurisdiction || 'Ontario';
  const canDo = [
    'Explain general processes (tribunals, courts, complaint steps)',
    'Summarize options with plain language and citations',
    'Help organize evidence and timelines',
    `Provide information-first guidance tailored to ${jurisdiction}`
  ];
  const cannotDo = [
    'Tell you what to file or give legal advice',
    'Draft legal arguments or strategy',
    'Act as your representative or contact the other side for you',
    'Override deadlines or rules'
  ];
  return [
    `For ${audience} users:`,
    'What We CAN Do:',
    ...canDo.map((x) => `- ${x}`),
    'What We CANNOT Do:',
    ...cannotDo.map((x) => `- ${x}`),
    'If you need advice or representation, contact a lawyer or licensed paralegal.'
  ].join('\n');
}
