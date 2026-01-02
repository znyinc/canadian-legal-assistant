import { MatterClassification, Domain } from '../models';

/**
 * Priority level for action steps
 */
export type ActionPriority = 'urgent' | 'soon' | 'when-ready';

/**
 * Individual action step in the user's action plan
 */
export interface ActionStep {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  timeframe: string; // "Within 24-48 hours", "Within 7 days", etc.
  completed: boolean;
}

/**
 * Role explanation for different legal contexts
 */
export interface RoleExplanation {
  title: string;
  summary: string;
  responsibilities: string[];
  whatYouAreNot: string[];
  learnMoreUrl?: string;
}

/**
 * Settlement pathway option
 */
export interface SettlementPathway {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  typical: boolean; // Is this the most common pathway?
}

/**
 * Things to avoid for this case type
 */
export interface WhatToAvoid {
  action: string;
  reason: string;
  severity: 'critical' | 'warning' | 'caution';
}

/**
 * Next step offer for user
 */
export interface NextStepOffer {
  id: string;
  title: string;
  description: string;
  actionLabel: string; // Button text
  documentType?: string; // If this generates a document
}

/**
 * Complete action plan for user
 */
export interface ActionPlan {
  acknowledgment: string;
  immediateActions: ActionStep[];
  roleExplanation: RoleExplanation;
  settlementPathways: SettlementPathway[];
  whatToAvoid: WhatToAvoid[];
  nextStepOffers: NextStepOffer[];
}

/**
 * Generates action-first, empathetic action plans from matter classifications.
 * Converts technical legal classifications into user-friendly, actionable guidance.
 */
export class ActionPlanGenerator {
  /**
   * Generate complete action plan from classification
   */
  generate(classification: MatterClassification): ActionPlan {
    const domain = classification.domain || 'other';

    return {
      acknowledgment: this.generateAcknowledgment(domain, classification),
      immediateActions: this.generateImmediateActions(domain, classification),
      roleExplanation: this.generateRoleExplanation(domain, classification),
      settlementPathways: this.generateSettlementPathways(domain, classification),
      whatToAvoid: this.generateWhatToAvoid(domain, classification),
      nextStepOffers: this.generateNextStepOffers(domain, classification),
    };
  }

  /**
   * Generate empathetic acknowledgment message
   */
  private generateAcknowledgment(domain: Domain, classification: MatterClassification): string {
    const situationMap: Record<Domain, string> = {
      criminal: "dealing with criminal charges",
      'civil-negligence': "dealing with property damage or injury",
      landlordTenant: "facing a landlord-tenant dispute",
      employment: "dealing with an employment issue",
      insurance: "having difficulty with an insurance claim",
      humanRights: "facing discrimination or harassment",
      municipalPropertyDamage: "dealing with damage caused by municipal property",
      'tree-damage': "dealing with tree damage from a neighbor's property",
      ocppFiling: "preparing a court filing for Toronto Region Superior Court",
      consumerProtection: "dealing with a consumer protection issue",
      legalMalpractice: "dealing with potential legal malpractice",
      estateSuccession: "dealing with estate and succession matters",
      other: "dealing with a legal issue",
    };

    const situation = situationMap[domain] || "dealing with a legal matter";
    const urgency = classification.urgency === 'high' 
      ? " This can be stressful, especially with tight timelines."
      : " This can be overwhelming, but there are clear steps to take.";

    return `You're ${situation}.${urgency}`;
  }

  /**
   * Generate immediate action steps based on domain
   */
  private generateImmediateActions(domain: Domain, classification: MatterClassification): ActionStep[] {
    const actions: ActionStep[] = [];

    // Criminal-specific actions
    if (domain === 'criminal') {
      actions.push({
        id: 'criminal-occurrence',
        priority: 'urgent',
        title: 'Obtain Police Occurrence Number',
        description: 'If you haven\'t already, get the police occurrence number (file number) for reference. Contact the officer who took your statement or call the police division.',
        timeframe: 'Within 24 hours',
        completed: false,
      });

      actions.push({
        id: 'criminal-medical',
        priority: 'urgent',
        title: 'Seek Medical Attention for Injuries',
        description: 'Even if injuries seem minor, get them medically documented. Visit urgent care, walk-in clinic, or your doctor. Request copies of medical notes and dated photos.',
        timeframe: 'Within 24-48 hours',
        completed: false,
      });

      actions.push({
        id: 'criminal-victim-services',
        priority: 'soon',
        title: 'Contact Victim Services',
        description: 'Victim Services Ontario can provide free support, court accompaniment, and updates on your case. They can help you prepare a Victim Impact Statement.',
        timeframe: 'Within 7 days',
        completed: false,
      });
    }

    // Civil negligence actions
    if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
      actions.push({
        id: 'civil-evidence',
        priority: 'urgent',
        title: 'Preserve and Photograph Evidence',
        description: 'Take detailed photos and videos of damage, the scene, and any hazards. Do this before cleanup if possible. Save all repair estimates and invoices.',
        timeframe: 'Within 24-48 hours',
        completed: false,
      });

      actions.push({
        id: 'civil-demand',
        priority: 'soon',
        title: 'Send Formal Demand Letter',
        description: 'Before going to court, send a written demand letter outlining damages and requesting payment. This shows reasonableness and is expected by courts.',
        timeframe: 'Within 14 days',
        completed: false,
      });

      if (domain === 'municipalPropertyDamage') {
        actions.push({
          id: 'municipal-notice',
          priority: 'urgent',
          title: 'File 10-Day Municipal Notice',
          description: 'Ontario law requires written notice to the municipality within 10 days for property damage claims. Missing this deadline may prevent you from suing.',
          timeframe: 'Within 10 days of damage',
          completed: false,
        });
      }
    }

    // Landlord-tenant actions
    if (domain === 'landlordTenant') {
      actions.push({
        id: 'ltb-evidence',
        priority: 'soon',
        title: 'Gather Evidence and Documentation',
        description: 'Collect rent receipts, lease agreement, photos of issues, and written communications with landlord. Organize chronologically.',
        timeframe: 'Before filing application',
        completed: false,
      });

      actions.push({
        id: 'ltb-application',
        priority: 'soon',
        title: 'File LTB Application',
        description: 'File the appropriate Landlord and Tenant Board application (T1, T2, or T6). Applications can be filed online or by mail.',
        timeframe: 'Within applicable deadline',
        completed: false,
      });
    }

    // Employment actions
    if (domain === 'employment') {
      actions.push({
        id: 'employment-documentation',
        priority: 'urgent',
        title: 'Document Employment Details',
        description: 'Gather employment contract, pay stubs, termination letter, and any written communications. Calculate notice period and severance entitlements.',
        timeframe: 'Within 7 days',
        completed: false,
      });

      actions.push({
        id: 'employment-mol',
        priority: 'soon',
        title: 'Consider Ministry of Labour Complaint',
        description: 'For Employment Standards Act violations (unpaid wages, vacation pay, termination pay), file a complaint with the Ministry of Labour within 1 year.',
        timeframe: 'Within 1 year',
        completed: false,
      });
    }

    // Default action for all cases if no specific actions
    if (actions.length === 0) {
      actions.push({
        id: 'general-evidence',
        priority: 'soon',
        title: 'Gather Evidence and Documentation',
        description: 'Collect all relevant documents, photos, emails, and receipts related to your case. Organize them chronologically.',
        timeframe: 'As soon as possible',
        completed: false,
      });
    }

    return actions;
  }

  /**
   * Generate role explanation for user
   */
  private generateRoleExplanation(domain: Domain, classification: MatterClassification): RoleExplanation {
    // Criminal complainant/victim role
    if (domain === 'criminal') {
      return {
        title: 'Your Role as a Criminal Complainant',
        summary: 'You are a witness in the criminal case, not the prosecutor. The Crown Attorney (prosecutor) handles the case on behalf of the state.',
        responsibilities: [
          'Provide a full statement to police',
          'Testify in court if called as a witness',
          'Submit a Victim Impact Statement (optional)',
          'Cooperate with the Crown Attorney',
          'Attend court dates if subpoenaed',
        ],
        whatYouAreNot: [
          'You are NOT the prosecutor (the Crown Attorney is)',
          'You do NOT decide whether charges proceed',
          'You cannot "drop charges" (only the Crown can withdraw)',
          'You do NOT need to hire a lawyer for the criminal trial',
        ],
        learnMoreUrl: 'https://www.ontario.ca/page/get-help-victim-services',
      };
    }

    // Civil plaintiff role
    if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
      return {
        title: 'Your Role as a Plaintiff',
        summary: 'You are the plaintiff bringing a civil claim for damages. You have the burden of proving your case on a balance of probabilities.',
        responsibilities: [
          'Prove the defendant caused your damages',
          'Prove the amount of damages with evidence',
          'Serve court documents properly',
          'Attend all court dates and hearings',
          'Consider settlement offers seriously',
        ],
        whatYouAreNot: [
          'You do NOT have to prove beyond a reasonable doubt (civil standard is lower)',
          'You are NOT limited to court only (settlement is common)',
          'You do NOT need to accept the first settlement offer',
        ],
        learnMoreUrl: 'https://www.ontario.ca/page/guide-to-small-claims-court',
      };
    }

    // Landlord-tenant applicant role
    if (domain === 'landlordTenant') {
      return {
        title: 'Your Role as a Tenant Applicant',
        summary: 'You are the applicant at the Landlord and Tenant Board. The LTB is an informal tribunal designed to be accessible without a lawyer.',
        responsibilities: [
          'File the correct LTB application form',
          'Serve your landlord with the application',
          'Gather and organize your evidence',
          'Attend the hearing on time',
          'Present your case clearly to the adjudicator',
        ],
        whatYouAreNot: [
          'You do NOT need a lawyer (but can have one)',
          'You are NOT in criminal court (this is a tribunal)',
          'You do NOT need to prove beyond a reasonable doubt',
        ],
        learnMoreUrl: 'https://tribunalsontario.ca/ltb/',
      };
    }

    // Employment complainant role
    if (domain === 'employment') {
      return {
        title: 'Your Role as an Employment Complainant',
        summary: 'You can pursue employment issues through the Ministry of Labour (for ESA violations) or civil court (for wrongful dismissal). You choose the pathway.',
        responsibilities: [
          'Document employment details and timeline',
          'Calculate entitlements (notice, severance)',
          'Choose the appropriate pathway (MOL vs court)',
          'File complaint or claim within deadlines',
          'Provide evidence of employment and termination',
        ],
        whatYouAreNot: [
          'You are NOT required to use both pathways (choose one)',
          'You do NOT need a lawyer for MOL complaints',
          'You are NOT limited to statutory minimums (court may award more)',
        ],
        learnMoreUrl: 'https://www.ontario.ca/page/filing-employment-standards-claim',
      };
    }

    // Default role
    return {
      title: 'Your Role in This Matter',
      summary: 'You are seeking to resolve a legal issue. Understanding your role and responsibilities will help you navigate the process.',
      responsibilities: [
        'Gather all relevant evidence',
        'Meet all applicable deadlines',
        'Follow proper legal procedures',
        'Consider all available options',
      ],
      whatYouAreNot: [
        'You are NOT required to go to court immediately',
        'You are NOT without options',
      ],
    };
  }

  /**
   * Generate settlement pathways
   */
  private generateSettlementPathways(domain: Domain, classification: MatterClassification): SettlementPathway[] {
    const pathways: SettlementPathway[] = [];

    // Criminal cases - no traditional settlement but peace bond option
    if (domain === 'criminal') {
      pathways.push({
        title: 'Peace Bond (810 Order)',
        description: 'A civil order requiring the accused to keep the peace and stay away from you. Can be applied for separately from the criminal charges.',
        pros: [
          'Faster than waiting for trial',
          'Provides immediate protection',
          'No need to testify at trial',
        ],
        cons: [
          'Not a criminal conviction',
          'Does not result in punishment',
          'Separate application required',
        ],
        typical: false,
      });
    }

    // Civil cases always have settlement options
    if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
      pathways.push({
        title: 'Pre-Trial Settlement',
        description: 'Negotiate a settlement before filing a lawsuit or after filing but before trial. Most civil cases settle this way.',
        pros: [
          'Faster resolution (months vs years)',
          'Saves court filing fees and legal costs',
          'You control the outcome (no judge decision)',
          'Can include payment plans or non-monetary terms',
        ],
        cons: [
          'May receive less than full claim amount',
          'No public court record',
          'No precedent set',
        ],
        typical: true,
      });

      pathways.push({
        title: 'Small Claims Court Trial',
        description: 'File a lawsuit and proceed to trial if settlement fails. Judge decides liability and damages.',
        pros: [
          'Formal court decision enforceable by law',
          'Can recover court costs if you win',
          'Public record of judgment',
        ],
        cons: [
          'Longer timeline (6-18+ months)',
          'Court filing fees ($115-$315)',
          'Must prove case to judge',
          'May receive nothing if you lose',
        ],
        typical: false,
      });

      if (domain === 'municipalPropertyDamage') {
        pathways.push({
          title: 'Insurance Subrogation',
          description: 'Your homeowner\'s insurance may cover damages and then pursue the municipality on your behalf (subrogation).',
          pros: [
            'Insurance handles the claim',
            'You get repairs covered (less deductible)',
            'No need to sue personally',
          ],
          cons: [
            'Must pay deductible',
            'Claim may affect future premiums',
            'No control over insurer\'s strategy',
          ],
          typical: true,
        });
      }
    }

    // Legal malpractice settlement options
    if (domain === 'legalMalpractice') {
      pathways.push({
        title: 'Negotiated Settlement / Demand Response',
        description: 'The lawyer or their insurer (LawPRO) may respond to your formal demand letter with a settlement offer within 21 days.',
        pros: [
          'Faster resolution than litigation',
          'Often covered by claims-made insurance (LawPRO)',
          'Preserve professional relationships if desired',
          'Confidentiality can be negotiated',
        ],
        cons: [
          'May receive less than claim amount',
          'No public accountability',
          'Must negotiate directly with lawyer or insurer',
        ],
        typical: true,
      });

      const amount = classification?.disputeAmount || 0;
      
      if (amount < 50000) {
        pathways.push({
          title: 'Small Claims Court',
          description: 'File in Small Claims Court (jurisdiction limit $50,000). Judge decides liability and damages based on "balance of probabilities".',
          pros: [
            'Lower filing fees ($115-$315)',
            'Simplified rules (no Discovery phase)',
            'Faster timeline (6-12 months)',
            'Enforceable court judgment',
          ],
          cons: [
            'Limited to $50,000',
            'No right to appeal on facts',
            'Must represent yourself or hire own lawyer',
          ],
          typical: false,
        });
      } else {
        pathways.push({
          title: 'Superior Court Litigation',
          description: 'File in Superior Court for amounts over $50,000. Full discovery, expert evidence, and trial if settlement fails.',
          pros: [
            'No dollar limit on claim',
            'Full disclosure process (Discovery)',
            'Expert witness testimony',
            'Right of appeal',
            'Enforceable court judgment',
          ],
          cons: [
            'Higher filing fees ($270+)',
            'Expensive litigation (lawyers, experts)',
            'Lengthy timeline (2-4+ years)',
            'Risky - if you lose, you may pay court costs',
          ],
          typical: false,
        });
      }
    }

    // Employment settlement options
    if (domain === 'employment') {
      pathways.push({
        title: 'Negotiated Severance Package',
        description: 'Negotiate a settlement with your employer for severance pay, continued benefits, or other compensation.',
        pros: [
          'Quick resolution',
          'Can negotiate higher amounts than court',
          'Maintain confidentiality',
          'Preserve references',
        ],
        cons: [
          'Must sign release waiving future claims',
          'May receive less than full entitlement',
          'No public accountability',
        ],
        typical: true,
      });
    }

    // Default settlement pathway if none specific
    if (pathways.length === 0) {
      pathways.push({
        title: 'Negotiated Settlement',
        description: 'Attempt to resolve the dispute through negotiation before formal legal proceedings.',
        pros: [
          'Faster and less expensive',
          'You control the outcome',
          'Preserves relationships when possible',
        ],
        cons: [
          'May require compromise',
          'Not enforceable unless in writing',
        ],
        typical: true,
      });
    }

    return pathways;
  }

  /**
   * Generate what to avoid guidance
   */
  private generateWhatToAvoid(domain: Domain, classification: MatterClassification): WhatToAvoid[] {
    const avoidList: WhatToAvoid[] = [];

    // Criminal cases
    if (domain === 'criminal') {
      avoidList.push(
        {
          action: 'Do NOT contact the accused directly',
          reason: 'This violates no-contact conditions and can jeopardize the case. All contact goes through police and Crown.',
          severity: 'critical',
        },
        {
          action: 'Do NOT post about the incident on social media',
          reason: 'Posts can be used against you in court and may undermine your credibility. Keep details private.',
          severity: 'critical',
        },
        {
          action: 'Do NOT alter evidence or delete messages',
          reason: 'Preserve all evidence exactly as it is. Deleting or editing can be seen as tampering.',
          severity: 'critical',
        }
      );
    }

    // Civil cases
    if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
      avoidList.push(
        {
          action: 'Do NOT repair damage before photographing thoroughly',
          reason: 'You need clear evidence of the damage before cleanup. Take many photos from different angles.',
          severity: 'critical',
        },
        {
          action: 'Do NOT accept verbal settlement offers without written confirmation',
          reason: 'Verbal agreements are difficult to enforce. Get everything in writing with signatures.',
          severity: 'warning',
        },
        {
          action: 'Do NOT ignore limitation periods',
          reason: 'Missing deadlines can permanently bar your claim. File within the limitation period.',
          severity: 'critical',
        }
      );
    }

    // Landlord-tenant
    if (domain === 'landlordTenant') {
      avoidList.push(
        {
          action: 'Do NOT withhold rent without LTB approval',
          reason: 'Withholding rent can lead to eviction. Apply to the LTB first, then follow their order.',
          severity: 'critical',
        },
        {
          action: 'Do NOT rely on verbal agreements with landlord',
          reason: 'Always get lease changes, repairs promises, or agreements in writing via email or text.',
          severity: 'warning',
        }
      );
    }

    // Employment
    if (domain === 'employment') {
      avoidList.push(
        {
          action: 'Do NOT sign a release without reading it carefully',
          reason: 'Once you sign a release, you waive the right to sue. Consider legal advice before signing.',
          severity: 'critical',
        },
        {
          action: 'Do NOT delay filing if approaching the 1-year ESA deadline',
          reason: 'Employment Standards Act claims must be filed within 1 year. Missing the deadline means you lose statutory entitlements.',
          severity: 'critical',
        }
      );
    }

    // Universal avoidance
    avoidList.push({
      action: 'Do NOT proceed without understanding your options',
      reason: 'Take time to understand the different pathways available. Rushing into court may not be the best choice.',
      severity: 'caution',
    });

    return avoidList;
  }

  /**
   * Generate next step offers
   */
  private generateNextStepOffers(domain: Domain, classification: MatterClassification): NextStepOffer[] {
    const offers: NextStepOffer[] = [];

    // Criminal offers
    if (domain === 'criminal') {
      offers.push(
        {
          id: 'victim-services-guide',
          title: 'Victim Services Guide',
          description: 'Get detailed information about Victim Services Ontario, how to access support, and what help is available.',
          actionLabel: 'View Victim Services Guide',
          documentType: 'victim_services_guide',
        },
        {
          id: 'evidence-checklist',
          title: 'Evidence Checklist',
          description: 'A comprehensive checklist of evidence to gather for a criminal case (photos, medical records, communications).',
          actionLabel: 'Get Evidence Checklist',
          documentType: 'criminal_evidence_checklist',
        },
        {
          id: 'complainant-role',
          title: 'Your Role as Complainant',
          description: 'Understand what it means to be a witness, what the Crown Attorney does, and what to expect at court.',
          actionLabel: 'Learn About Your Role',
          documentType: 'complainant_role_guide',
        }
      );
    }

    // Civil offers
    if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
      offers.push(
        {
          id: 'demand-letter',
          title: 'Draft a Demand Letter',
          description: 'Create a formal demand letter outlining your damages and requesting payment. This is typically sent before filing a lawsuit.',
          actionLabel: 'Generate Demand Letter',
          documentType: 'demand_letter',
        },
        {
          id: 'evidence-guide',
          title: 'Evidence Gathering Guide',
          description: 'Learn what evidence you need for a property damage claim (photos, estimates, reports, witness statements).',
          actionLabel: 'Get Evidence Guide',
          documentType: 'civil_evidence_guide',
        }
      );

      if (domain === 'municipalPropertyDamage') {
        offers.push({
          id: 'municipal-notice',
          title: '10-Day Municipal Notice Template',
          description: 'Generate the required written notice to the municipality for property damage claims. Must be sent within 10 days.',
          actionLabel: 'Create Municipal Notice',
          documentType: 'municipal_notice',
        });
      }
    }

    // Landlord-tenant offers
    if (domain === 'landlordTenant') {
      offers.push(
        {
          id: 'ltb-application',
          title: 'LTB Application Guidance',
          description: 'Step-by-step guide to filing a Landlord and Tenant Board application (T1, T2, or T6) with evidence checklists.',
          actionLabel: 'Get LTB Application Guide',
          documentType: 'ltb_application_guide',
        },
        {
          id: 'evidence-checklist',
          title: 'Tenant Evidence Checklist',
          description: 'Comprehensive checklist of documents and evidence needed for your LTB hearing.',
          actionLabel: 'View Evidence Checklist',
          documentType: 'ltb_evidence_checklist',
        }
      );
    }

    // Employment offers
    if (domain === 'employment') {
      offers.push(
        {
          id: 'severance-calculator',
          title: 'Severance Entitlement Estimate',
          description: 'Calculate your potential severance entitlement based on years of service, age, position, and other factors.',
          actionLabel: 'Calculate Severance',
          documentType: 'severance_calculator',
        },
        {
          id: 'mol-complaint',
          title: 'Ministry of Labour Complaint Guide',
          description: 'Step-by-step guide to filing an Employment Standards Act complaint with the Ministry of Labour.',
          actionLabel: 'Get MOL Complaint Guide',
          documentType: 'mol_complaint_guide',
        }
      );
    }

    // Universal offer
    offers.push({
      id: 'complete-package',
      title: 'Generate Complete Documentation Package',
      description: 'Create a comprehensive package with all relevant documents, templates, and guidance for your case.',
      actionLabel: 'Generate Full Package',
      documentType: 'complete_package',
    });

    return offers;
  }
}
