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

export interface EmpathyBoundaryPlan {
  audience: DisclaimerContext['audience'];
  jurisdiction: string;
  canDo: string[];
  cannotDo: string[];
  safeHarbor: string;
  examples: { request: string; redirect: string }[];
}

export interface AdviceRedirect {
  redirected: boolean;
  message: string;
  options: string[];
  safeHarbor: string;
  tone: 'gentle' | 'firm';
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
    const res = this.adviceRequestGuidance(userText);
    return { redirected: res.redirected, message: res.message };
  }

  // Empathy-focused boundary enforcement: What we CAN/CANNOT do
  empathyBoundaries = (ctx: DisclaimerContext): string => buildEmpathyBoundaries(ctx);

  empathyBoundaryPlan(ctx: DisclaimerContext): EmpathyBoundaryPlan {
    const jurisdiction = ctx.jurisdiction || 'Ontario (verify for your province/territory)';
    const audience = ctx.audience || 'self-represented';
    const safeHarbor = this.safeHarborPrinciple();
    const canDo = [
      'Explain general processes (tribunals, courts, complaint steps) with citations',
      'Summarize options with plain language and retrieval dates',
      'Help you organize evidence, timelines, and checklists',
      `Provide information-first guidance tailored to ${jurisdiction}`
    ];
    const cannotDo = [
      'Tell you what to file or give legal advice',
      'Draft legal arguments or litigation strategy',
      'Act as your representative or contact the other side',
      'Override deadlines, court rules, or give guarantees'
    ];
    const examples = [
      {
        request: '"Tell me exactly what to file."',
        redirect: 'I can outline information about typical forms and timelines, but please confirm with a lawyer/paralegal.'
      },
      {
        request: '"Should I sue or settle?"',
        redirect: 'I can list common pathways (internal complaint, tribunal, court) and their steps; choosing one requires legal advice.'
      }
    ];
    return { audience, jurisdiction, canDo, cannotDo, safeHarbor, examples };
  }

  adviceRequestGuidance(userText: string): AdviceRedirect {
    const advisoryPatterns = /(what should i do|can you advise|tell me what to file|should i sue|what do you recommend|is this a good idea)/i;
    const redirected = advisoryPatterns.test(userText || '');
    const safeHarbor = this.safeHarborPrinciple();
    const options = [
      'List informational pathways: internal complaint, tribunal/court filing, ombudsman, appeal/judicial review',
      'Clarify deadlines and evidence checklists',
      'Encourage contacting a lawyer or licensed paralegal for advice'
    ];
    const message = redirected
      ? 'I cannot provide legal advice. Here are information-only options you may consider, then confirm with a lawyer/paralegal.'
      : 'Proceeding with information-only guidance. If you need advice, consult a lawyer or licensed paralegal.';
    return { redirected, message, options, safeHarbor, tone: redirected ? 'firm' : 'gentle' };
  }

  safeHarborPrinciple(): string {
    return 'Safe Harbor Over Speed: we move carefully, avoid advice, and pause when requests look advisory. Accuracy and user safety outrank speed.';
  }
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
