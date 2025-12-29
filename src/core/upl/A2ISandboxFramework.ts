export type SandboxTier = 'public-info' | 'paralegal-supervised' | 'a2i-sandbox';

export interface SandboxInput {
  domain?: string;
  jurisdiction?: string;
  urgency?: 'low' | 'medium' | 'high';
  containsSensitiveData?: boolean;
}

export interface SandboxPlan {
  tier: SandboxTier;
  label: string;
  rationale: string;
  actions: string[];
  humanReview: {
    required: boolean;
    reason?: string;
    steps: string[];
  };
  auditTrail: string[];
  controls: string[];
}

export class A2ISandboxFramework {
  plan(input: SandboxInput): SandboxPlan {
    const tier = this.tierFor(input);
    const label = this.labelFor(tier);
    const rationale = this.rationaleFor(tier, input);

    const humanReviewRequired = tier === 'a2i-sandbox' || input.containsSensitiveData === true;
    const humanSteps = humanReviewRequired
      ? ['Pause automated actions', 'Escalate to licensed reviewer', 'Record reviewer decision and timestamp']
      : ['Proceed with informational guidance only', 'Offer contact info for licensed help'];

    const auditTrail = [
      'Record who requested guidance and when',
      'Log which tier was applied and why (jurisdiction/domain/urgency)',
      'Capture redirects to human review for potential Law Society oversight'
    ];

    const controls = this.controlsFor(tier, input.containsSensitiveData);

    const actions = this.actionsFor(tier);

    return {
      tier,
      label,
      rationale,
      actions,
      humanReview: {
        required: humanReviewRequired,
        reason: humanReviewRequired ? 'High-risk content or advisory request requires human oversight' : undefined,
        steps: humanSteps
      },
      auditTrail,
      controls
    };
  }

  private tierFor(input: SandboxInput): SandboxTier {
    const domain = (input.domain || '').toLowerCase();
    if (domain === 'criminal' || domain === 'ocppfiling') return 'a2i-sandbox';
    if (domain === 'civil-negligence' || domain === 'municipalpropertydamage') return 'paralegal-supervised';
    if (input.urgency === 'high') return 'paralegal-supervised';
    return 'public-info';
  }

  private labelFor(tier: SandboxTier): string {
    switch (tier) {
      case 'public-info':
        return 'Tier 1: Public Information';
      case 'paralegal-supervised':
        return 'Tier 2: Paralegal-Supervised Tools';
      case 'a2i-sandbox':
        return 'Tier 3: A2I Sandbox (human-in-the-loop)';
      default:
        return 'Tier 1: Public Information';
    }
  }

  private rationaleFor(tier: SandboxTier, input: SandboxInput): string {
    const jurisdiction = input.jurisdiction || 'Ontario';
    if (tier === 'a2i-sandbox') {
      return `High-risk or advice-adjacent content routed to a human reviewer before any filing guidance. Applies to sensitive matters in ${jurisdiction}.`;
    }
    if (tier === 'paralegal-supervised') {
      return `Information provided with extra guardrails and prompts to consult a licensed paralegal/lawyer, especially for ${jurisdiction} matters with urgency or liability exposure.`;
    }
    return 'Low-risk informational guidance with clear UPL boundaries and citations.';
  }

  private controlsFor(tier: SandboxTier, containsSensitiveData?: boolean): string[] {
    const base = ['Enforce information-only responses', 'Highlight citation and retrieval date requirements', 'Include Safe Harbor reminder'];
    if (tier === 'paralegal-supervised') {
      base.push('Insert advisory redirection before giving next steps');
      base.push('Require confirmation before showing forms or templates');
    }
    if (tier === 'a2i-sandbox') {
      base.push('Block direct form recommendations until human review');
      base.push('Log all prompts and outputs for oversight');
    }
    if (containsSensitiveData) {
      base.push('Recommend redaction of personal identifiers before sharing');
    }
    return base;
  }

  private actionsFor(tier: SandboxTier): string[] {
    if (tier === 'a2i-sandbox') {
      return [
        'Stop before suggesting filings; route to human review',
        'Provide checklist questions instead of recommendations',
        'Offer links to official resources (CanLII, court/tribunal sites)'
      ];
    }
    if (tier === 'paralegal-supervised') {
      return [
        'Surface multiple pathways with pros/cons',
        'Show deadlines and evidence checklists without recommending a strategy',
        'Prompt user to confirm facts and consult licensed help'
      ];
    }
    return [
      'Share plain-language process overviews',
      'Encourage evidence organization and deadline awareness',
      'Remind user to verify against current law and seek advice when needed'
    ];
  }
}
