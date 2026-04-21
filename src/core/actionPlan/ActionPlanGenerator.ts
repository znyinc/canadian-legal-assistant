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
 * Priority context for dynamic step ordering (Task 26.4.2)
 */
export interface PriorityContext {
  daysUntilDeadline?: number;
  hasActiveDeadline: boolean;
  evidencePreservationCritical: boolean;
  financialUrgency: boolean;
  safetyRisk: boolean;
}

/**
 * Conditional logic rule for dynamic action generation (Task 26.4.2)
 */
export interface ConditionalRule {
  condition: (context: PriorityContext, classification: MatterClassification) => boolean;
  action: ActionStep;
  reason: string;
}

type CriminalActionContext = 'charged-person' | 'reporting-party' | 'civil-overlap' | 'unclear';

/**
 * Generates action-first, empathetic action plans from matter classifications.
 * Converts technical legal classifications into user-friendly, actionable guidance.
 * 
 * Task 26.4.2: Enhanced with dynamic step prioritization and conditional logic for agent integration
 */
export class ActionPlanGenerator {
  private conditionalRules: ConditionalRule[] = [];

  constructor() {
    this.loadConditionalRules();
  }

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
   * Generate action plan with dynamic prioritization based on context (Task 26.4.2)
   */
  generateWithPrioritization(
    classification: MatterClassification,
    context: PriorityContext
  ): ActionPlan {
    const domain = classification.domain || 'other';
    const baseActions = this.generateImmediateActions(domain, classification);

    // Apply conditional rules to add context-specific actions
    const conditionalActions = this.conditionalRules
      .filter(rule => rule.condition(context, classification))
      .map(rule => rule.action);

    // Combine and re-prioritize all actions
    const allActions = [...baseActions, ...conditionalActions];
    const prioritizedActions = this.reprioritizeActions(allActions, context);

    return {
      acknowledgment: this.generateAcknowledgment(domain, classification),
      immediateActions: prioritizedActions,
      roleExplanation: this.generateRoleExplanation(domain, classification),
      settlementPathways: this.generateSettlementPathways(domain, classification),
      whatToAvoid: this.generateWhatToAvoid(domain, classification),
      nextStepOffers: this.generateNextStepOffers(domain, classification),
    };
  }

  /**
   * Re-prioritize actions based on dynamic context
   */
  private reprioritizeActions(actions: ActionStep[], context: PriorityContext): ActionStep[] {
    return actions
      .map(action => {
        let newPriority = action.priority;

        // Escalate priority based on context
        if (context.hasActiveDeadline && context.daysUntilDeadline && context.daysUntilDeadline <= 7) {
          if (action.title.includes('Notice') || action.title.includes('Deadline')) {
            newPriority = 'urgent';
          }
        }

        if (context.evidencePreservationCritical && action.title.includes('Evidence')) {
          newPriority = 'urgent';
        }

        if (context.safetyRisk && action.title.includes('Safety')) {
          newPriority = 'urgent';
        }

        return { ...action, priority: newPriority };
      })
      .sort((a, b) => {
        const priorityOrder = { urgent: 1, soon: 2, 'when-ready': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Load conditional rules for dynamic action generation
   */
  private loadConditionalRules(): void {
    // Municipal 10-day notice rule
    this.conditionalRules.push({
      condition: (ctx, classification) =>
        classification.domain === 'municipalPropertyDamage' && ctx.hasActiveDeadline && (ctx.daysUntilDeadline || 0) <= 10,
      action: {
        id: 'municipal-urgent-notice',
        priority: 'urgent',
        title: 'URGENT: File 10-Day Municipal Notice NOW',
        description: 'You have less than 10 days remaining to file notice with the municipality. Missing this deadline will prevent you from suing. Drop everything and file today.',
        timeframe: `${0} days remaining`,
        completed: false,
      },
      reason: 'Municipal notice deadline is critical and imminent',
    });

    // Evidence preservation for injury cases
    this.conditionalRules.push({
      condition: (ctx, classification) =>
        ctx.evidencePreservationCritical &&
        (classification.domain === 'civil-negligence' || classification.domain === 'municipalPropertyDamage'),
      action: {
        id: 'critical-evidence-preservation',
        priority: 'urgent',
        title: 'Preserve Physical Evidence Immediately',
        description: 'Evidence degradation is a critical risk. Photograph and secure all physical evidence before it is altered, cleaned, or discarded.',
        timeframe: 'Within 24 hours',
        completed: false,
      },
      reason: 'Physical evidence is at risk of being lost or altered',
    });

    // Financial urgency for employment termination
    this.conditionalRules.push({
      condition: (ctx, classification) =>
        ctx.financialUrgency && classification.domain === 'employment',
      action: {
        id: 'financial-hardship-action',
        priority: 'urgent',
        title: 'Apply for Employment Insurance (EI)',
        description: 'If you are facing financial hardship, apply for EI benefits immediately. You can still pursue legal action while receiving EI.',
        timeframe: 'Within 48 hours',
        completed: false,
      },
      reason: 'Financial urgency requires immediate income replacement',
    });
  }

  /**
   * Generate empathetic acknowledgment message
   */
  private generateAcknowledgment(domain: Domain, classification: MatterClassification): string {
    if (domain === 'criminal') {
      const narrativeText = this.getNarrativeText(classification);
      const criminalContext = this.detectCriminalActionContext(narrativeText);

      if (criminalContext === 'charged-person') {
        return 'You are dealing with a criminal matter where you may be responding to charges. This can feel stressful, especially if court dates or release conditions are already active.';
      }

      if (criminalContext === 'reporting-party') {
        return 'You are dealing with a criminal matter after a reported incident. This can feel stressful, especially if safety concerns or police follow-up are still unfolding.';
      }

      if (criminalContext === 'civil-overlap') {
        return 'You are dealing with overlapping civil and police-related issues. This can be overwhelming, and the first priority is to protect any live civil deadline while you organize the records tied to the allegation or report.';
      }

      return 'You are dealing with a criminal or police-related issue. This can be overwhelming, and the first step is to confirm whether you are responding to charges, reporting an incident, or managing related civil fallout.';
    }

    const situationMap: Record<Domain, string> = {
      criminal: "dealing with a criminal or police-related issue",
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
    const narrativeText = this.getNarrativeText(classification);

    // Criminal-specific actions
    if (domain === 'criminal') {
      const criminalContext = this.detectCriminalActionContext(narrativeText);

      if (criminalContext === 'civil-overlap' || this.hasCivilVsCriminalSequencingSignal(narrativeText)) {
        actions.push({
          id: 'criminal-civil-sequencing',
          priority: 'urgent',
          title: 'Protect Active Civil Deadlines First',
          description: 'If a civil filing or response deadline is already active, address that deadline first (or request an extension) so you do not lose procedural rights. Preserve evidence of alleged false statements now, then file a police complaint with organized records. If there is immediate danger or threats, contact police right away.',
          timeframe: 'Today (before the next filing deadline)',
          completed: false,
        });
      }

      if (criminalContext === 'charged-person') {
        actions.push(
          {
            id: 'criminal-court-dates',
            priority: 'urgent',
            title: 'Confirm Every Court Date and Condition',
            description: 'Write down every court date, release term, and no-contact condition that already applies to you so nothing is missed by accident.',
            timeframe: 'Today',
            completed: false,
          },
          {
            id: 'criminal-legal-representation',
            priority: 'urgent',
            title: 'Track Legal Representation and Court Paperwork',
            description: 'Keep all court papers together and note whether you have spoken with a lawyer or duty counsel, and what information you still need to review.',
            timeframe: 'Within 24 hours',
            completed: false,
          },
          {
            id: 'criminal-defence-records',
            priority: 'soon',
            title: 'Preserve Messages, Witnesses, and Your Timeline',
            description: 'Keep the messages, call logs, witness details, and sequence of events tied to the allegation in one place while memory is still fresh.',
            timeframe: 'Within 48 hours',
            completed: false,
          },
        );
      } else if (criminalContext === 'reporting-party') {
        actions.push(
          {
            id: 'criminal-occurrence',
            priority: 'urgent',
            title: 'Record the Police File Details',
            description: 'If police are involved, write down the file number, officer name, and the date of each update so you can track the record accurately.',
            timeframe: 'Within 24 hours',
            completed: false,
          },
          {
            id: 'criminal-evidence-preservation',
            priority: 'urgent',
            title: 'Preserve the Timeline and Evidence',
            description: 'Keep screenshots, photos, witness names, and your timeline in one place. If there are injuries, keep the medical notes and dated photos with that file.',
            timeframe: 'Within 24-48 hours',
            completed: false,
          },
          this.hasSafetySupportSignal(narrativeText)
            ? {
                id: 'criminal-safety-tracking',
                priority: 'soon',
                title: 'Track Ongoing Safety Concerns and Support Needs',
                description: 'If there is ongoing contact, fear, or harassment, record each incident and ask police or victim support services how updates and safety planning are handled.',
                timeframe: 'Within 7 days',
                completed: false,
              }
            : {
                id: 'criminal-follow-up-log',
                priority: 'soon',
                title: 'Keep Follow-Up Details Organized',
                description: 'Keep witness details, officer updates, and any request for more information together so the file stays easy to follow.',
                timeframe: 'Within 7 days',
                completed: false,
              },
        );
      } else if (criminalContext === 'civil-overlap') {
        actions.push(
          {
            id: 'criminal-civil-records',
            priority: 'urgent',
            title: 'Separate the Civil Record from the Police Record',
            description: 'Keep pleadings, court deadlines, and civil communications separate from the police-related material so the chronology stays clear and usable.',
            timeframe: 'Today',
            completed: false,
          },
          {
            id: 'criminal-false-allegation-record',
            priority: 'soon',
            title: 'Preserve the Statements You Say Are False',
            description: 'Save the exact messages, pleadings, or reports that you say are false, along with the date and where each statement appeared.',
            timeframe: 'Within 48 hours',
            completed: false,
          },
        );
      } else {
        actions.push(
          {
            id: 'criminal-role-clarification',
            priority: 'urgent',
            title: 'Clarify Your Role in the Police Process',
            description: 'Write down whether you are responding to charges, reporting an incident, or managing both a police issue and another legal process.',
            timeframe: 'Today',
            completed: false,
          },
          {
            id: 'criminal-core-records',
            priority: 'urgent',
            title: 'Gather the Notices, Messages, and Timeline',
            description: 'Keep every letter, screenshot, message, and note tied to the event together while memory is still fresh.',
            timeframe: 'Within 24 hours',
            completed: false,
          },
          {
            id: 'criminal-date-log',
            priority: 'soon',
            title: 'Record the Dates and Police Contact Details',
            description: 'Write down when the event happened, whether police are involved, and any file or officer details you already have.',
            timeframe: 'Within 48 hours',
            completed: false,
          },
        );
      }
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
        title: 'Document Your Employment Details',
        description: 'Gather your employment contract, pay stubs, termination letter, and all written communications. Note your start date, position, and salary — these are inputs for both your ESA entitlements and common law reasonable notice.',
        timeframe: 'Within 48 hours',
        completed: false,
      });

      actions.push({
        id: 'employment-legal-consultation',
        priority: 'urgent',
        title: 'Get a Legal Consultation (Free Options Available)',
        description: 'Many employment lawyers offer a free 30-minute consultation. Ask about your common law notice entitlement (Bardal factors) — it is often significantly more than your ESA statutory minimums. Do NOT sign any release or severance offer before doing this.',
        timeframe: 'Within 7 days',
        completed: false,
      });

      actions.push({
        id: 'employment-mol',
        priority: 'soon',
        title: 'Decide Your Legal Pathway: MOL Complaint vs Civil Lawsuit',
        description: 'You have two main legal routes: (1) File a free Employment Standards Act complaint with the Ministry of Labour for statutory entitlements, or (2) Pursue a wrongful dismissal civil action for common law notice (usually a larger amount). These routes overlap — get advice before electing one, as the choice is consequential.',
        timeframe: 'Within 2 weeks',
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

  private getNarrativeText(classification: MatterClassification): string {
    const description = (classification as any)?.description;
    const notes = (classification as any)?.notes;
    const textParts: string[] = [];

    if (typeof description === 'string' && description.trim()) {
      textParts.push(description.trim());
    }

    if (Array.isArray(notes)) {
      const noteText = notes
        .filter((note): note is string => typeof note === 'string')
        .map((note) => note.trim())
        .filter(Boolean);
      textParts.push(...noteText);
    }

    return textParts.join(' ').toLowerCase();
  }

  private hasCivilVsCriminalSequencingSignal(text: string): boolean {
    if (!text) {
      return false;
    }

    const hasCriminalSignal = /(police|criminal|complain|report)/i.test(text);
    const hasCivilProcessSignal = /(civil|opposing counsel|respond|response|deadline|affidavit|motion|lawsuit|statement of defence)/i.test(text);
    const hasOrderingQuestionSignal = /(which|first|before|between)/i.test(text);

    return hasCriminalSignal && hasCivilProcessSignal && hasOrderingQuestionSignal;
  }

  private detectCriminalActionContext(text: string): CriminalActionContext {
    if (!text.trim()) {
      return 'unclear';
    }

    const accusedSignals = [
      'charged',
      'arrested',
      'accused',
      'bail',
      'release condition',
      'release conditions',
      'summons',
      'remand',
      'duty counsel',
      'disclosure',
      'plea',
      'court date',
    ].filter((term) => text.includes(term)).length;

    const reportingSignals = [
      'reported',
      'reporting',
      'police report',
      'witness',
      'victim',
      'complainant',
      'threatened me',
      'assaulted me',
      'unsafe',
      'safety',
    ].filter((term) => text.includes(term)).length;

    const civilSignals = [
      'civil',
      'lawsuit',
      'statement of defence',
      'statement of claim',
      'affidavit',
      'motion',
      'opposing counsel',
      'respond',
      'deadline',
      'false allegation',
      'false report',
      'defamation',
      'fabricated',
      'malicious',
    ].filter((term) => text.includes(term)).length;

    if (this.hasCivilVsCriminalSequencingSignal(text) || (civilSignals > 0 && (accusedSignals > 0 || reportingSignals > 0))) {
      return 'civil-overlap';
    }

    if (accusedSignals > reportingSignals && accusedSignals > 0) {
      return 'charged-person';
    }

    if (reportingSignals > 0) {
      return 'reporting-party';
    }

    return 'unclear';
  }

  private hasSafetySupportSignal(text: string): boolean {
    return /(unsafe|fear|afraid|threat|threatened me|ongoing contact|stalking|harass|harassment|violence|assaulted me|no contact)/i.test(text);
  }

  private hasPeaceBondSignal(text: string): boolean {
    return /(threat|harass|harassment|stalking|afraid|fear|ongoing contact|peace bond|no contact)/i.test(text);
  }

  /**
   * Generate role explanation for user
   */
  private generateRoleExplanation(domain: Domain, classification: MatterClassification): RoleExplanation {
    if (domain === 'criminal') {
      const criminalContext = this.detectCriminalActionContext(this.getNarrativeText(classification));

      if (criminalContext === 'charged-person') {
        return {
          title: 'Your Role in the Criminal Case',
          summary: 'You may be the person responding to charges. The prosecutor must prove the case, and your immediate responsibilities are to follow any conditions and keep track of court dates.',
          responsibilities: [
            'Follow every release or no-contact condition that applies to you',
            'Attend each scheduled court appearance',
            'Keep your timeline, witnesses, and records organized',
            'Review court paperwork or disclosure with a lawyer or duty counsel when available',
          ],
          whatYouAreNot: [
            'You are NOT required to guess the whole strategy on day one',
            'You are NOT responsible for proving the prosecution case',
            'You do NOT improve your position by breaching conditions or contacting restricted people',
          ],
        };
      }

      if (criminalContext === 'reporting-party') {
        return {
          title: 'Your Role After Reporting the Incident',
          summary: 'You may be a reporting witness. Police and the prosecutor decide whether charges proceed, while your role is to keep the timeline and evidence accurate.',
          responsibilities: [
            'Keep your statement, messages, photos, and witness details organized',
            'Respond if police or the prosecutor ask for clarification',
            'Track any safety concern or ongoing contact',
            'Attend court only if you are formally asked to do so',
          ],
          whatYouAreNot: [
            'You are NOT the prosecutor',
            'You do NOT decide whether charges proceed or end',
            'You do NOT need to confront the other person to keep the file moving',
          ],
          learnMoreUrl: 'https://www.ontario.ca/page/get-help-victim-services',
        };
      }

      if (criminalContext === 'civil-overlap') {
        return {
          title: 'Your Role Across the Civil Case and the Police Process',
          summary: 'The police process and the civil case can move on different timelines. Your job is to keep the records organized so one track does not cause you to miss something important on the other.',
          responsibilities: [
            'Protect any live civil filing deadline',
            'Keep pleadings, messages, and police-related records in one dated chronology',
            'Separate confirmed facts from allegations when you summarize the issue',
            'Track which process asked for which document',
          ],
          whatYouAreNot: [
            'You are NOT required to pause a civil deadline just because police are involved',
            'You do NOT need to merge every allegation into one document',
            'You are NOT helped by public accusations or reactive messages',
          ],
        };
      }

      return {
        title: 'Your Role in a Police-Related Matter',
        summary: 'Before you choose a process, confirm whether you are responding to charges, reporting an incident, or managing related civil fallout. That role changes what comes next.',
        responsibilities: [
          'Clarify your role in the matter',
          'Keep the timeline and core records together',
          'Track dates, notices, and police contact details',
          'Separate confirmed facts from assumptions',
        ],
        whatYouAreNot: [
          'You are NOT required to treat every police-related issue the same way',
          'You do NOT need to rush into public accusations or reactive contact',
          'You are NOT helped by ignoring other deadlines while this role stays unclear',
        ],
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
    const narrativeText = this.getNarrativeText(classification);

    if (domain === 'criminal') {
      const criminalContext = this.detectCriminalActionContext(narrativeText);

      if (criminalContext === 'charged-person') {
        pathways.push(
          {
            title: 'Court Appearances and Disclosure Review',
            description: 'The main pathway is usually scheduled appearances, court paperwork, and disclosure review before any resolution is known.',
            pros: [
              'Keeps the process tied to the actual allegation and evidence',
              'Gives you a clearer picture of what the prosecution says happened',
            ],
            cons: [
              'It can feel slow and procedural',
              'It may require several appearances before the path becomes clear',
            ],
            typical: true,
          },
          {
            title: 'Resolution Discussions if the Court Process Allows Them',
            description: 'Some cases move toward a negotiated resolution, but that depends on the charge, the record, and the prosecution position.',
            pros: [
              'Can narrow the issues earlier',
              'May reduce uncertainty if a formal offer is made',
            ],
            cons: [
              'Not every case is suitable for this',
              'The available outcome depends heavily on the facts',
            ],
            typical: false,
          },
        );
      } else if (criminalContext === 'reporting-party') {
        pathways.push({
          title: 'Police and Prosecutor Process',
          description: 'The usual path is continued police or prosecutor review, followed by updates about charges, appearances, or witness involvement if the case proceeds.',
          pros: [
            'Keeps the record within the formal criminal process',
            'Lets investigators and prosecutors decide what can proceed',
          ],
          cons: [
            'You do not control the pace or charging decision',
            'Updates can feel slow or incomplete from your perspective',
          ],
          typical: true,
        });

        if (this.hasPeaceBondSignal(narrativeText)) {
          pathways.push({
            title: 'Peace Bond',
            description: 'In some threat or harassment situations, a peace bond may be discussed as a separate protective process focused on keeping the peace.',
            pros: [
              'Can focus on future safety and boundaries',
              'May move differently from a full criminal prosecution',
            ],
            cons: [
              'It is not automatic and depends on the facts',
              'It is not the same as a criminal conviction',
            ],
            typical: false,
          });
        }
      } else if (criminalContext === 'civil-overlap') {
        pathways.push(
          {
            title: 'Protect the Civil Case While Organizing the Police Record',
            description: 'When both tracks exist, the usual path is to keep the civil deadline moving while separately preserving the record tied to the allegation or report.',
            pros: [
              'Reduces the risk of missing a live filing deadline',
              'Keeps the chronology clear across both processes',
            ],
            cons: [
              'Requires careful record organization',
              'The two tracks may move at different speeds',
            ],
            typical: true,
          },
          {
            title: 'Separate Legal Review if Charges Are Actually Laid',
            description: 'If the issue shifts from an allegation or report to actual charges, the criminal process may need its own focused review.',
            pros: [
              'Avoids treating a criminal file like a routine civil dispute',
              'Helps separate immediate criminal obligations from civil strategy',
            ],
            cons: [
              'Can add complexity and cost',
              'May require reworking the short-term plan quickly',
            ],
            typical: false,
          },
        );
      } else {
        pathways.push({
          title: 'Clarify Your Role Before Choosing a Process',
          description: 'Before selecting a formal path, confirm whether you are responding to charges, reporting an incident, or managing a connected civil problem.',
          pros: [
            'Reduces the risk of following the wrong checklist',
            'Keeps later steps tied to the right legal process',
          ],
          cons: [
            'It may delay a more specific plan by one short step',
            'You may need to gather one more concrete fact first',
          ],
          typical: true,
        });
      }
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
        title: 'Ministry of Labour (ESA) Complaint',
        description: 'File a free complaint with the Ministry of Labour for Employment Standards Act violations — termination pay, severance pay, unpaid wages, and vacation pay. Must be filed within 2 years of the violation.',
        pros: [
          'Free — no filing fee, no lawyer required',
          'Accessible — Ministry investigates on your behalf',
          'Clear statutory entitlements (termination pay, severance pay)',
          'Does not require going to court',
        ],
        cons: [
          'Limited to ESA statutory minimums (often less than common law)',
          'Electing this remedy may limit your ability to sue civilly for the same entitlements',
          'Investigation can take 6–18 months',
          'No compensation for bad faith or manner of dismissal',
        ],
        typical: true,
      });

      const disputeAmount = (classification as any)?.disputeAmount || 0;
      if (disputeAmount > 0 && disputeAmount <= 35000) {
        pathways.push({
          title: 'Wrongful Dismissal — Small Claims Court',
          description: 'Sue for common law reasonable notice in Small Claims Court (jurisdiction up to $35,000). Common law notice is often significantly more than ESA minimums — courts consider your age, length of service, position, and availability of comparable employment (Bardal factors).',
          pros: [
            'Can recover far more than ESA statutory entitlements',
            'No dollar limit on common law notice for longer-tenured employees (within $35K limit)',
            'Court judgment enforceable by law',
            'Simplified procedure — easier to self-represent than Superior Court',
          ],
          cons: [
            'Filing fee ($115–$315)',
            'Limited to $35,000 per claim',
            'Longer timeline than MOL complaint (6–18 months)',
            'You bear the burden of proving reasonable notice period',
          ],
          typical: false,
        });
      } else {
        pathways.push({
          title: 'Wrongful Dismissal — Civil Lawsuit',
          description: 'Sue for common law reasonable notice in civil court. Courts apply Bardal factors — age, length of service, character of employment, and availability of similar work — which can yield notice periods far exceeding ESA minimums. Claims over $35,000 go to Superior Court.',
          pros: [
            'Can recover significantly more than ESA statutory entitlements',
            'Can claim bad faith damages if dismissal was conducted improperly',
            'No dollar cap in Superior Court',
            'Full discovery process — access to employer documents',
          ],
          cons: [
            'Filing fee ($270+) and potential legal costs',
            'Lengthy timeline (1–4+ years for Superior Court)',
            'Risk: if you lose you may be ordered to pay employer\'s costs',
            'Requires proving reasonable notice period to a judge',
          ],
          typical: false,
        });
      }

      pathways.push({
        title: 'Negotiated Severance Package',
        description: 'Negotiate directly with your employer — or through a lawyer — for a severance package including pay, continued benefits, and a positive reference. Most employment cases resolve this way before any formal complaint or lawsuit.',
        pros: [
          'Fastest path to resolution (days to weeks)',
          'Can negotiate above ESA minimums and potentially above common law',
          'Maintain confidentiality — no public record',
          'Preserve professional relationship and references',
        ],
        cons: [
          'Must sign a full and final release waiving all future claims',
          'Do NOT sign without legal review — releases are binding and broad',
          'May receive less than your full legal entitlement',
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
      const narrativeText = this.getNarrativeText(classification);
      const criminalContext = this.detectCriminalActionContext(narrativeText);

      if (criminalContext === 'charged-person') {
        avoidList.push(
          {
            action: 'Do NOT breach release or no-contact conditions',
            reason: 'A condition breach creates a new problem immediately and can make the situation worse very quickly.',
            severity: 'critical',
          },
          {
            action: 'Do NOT post about the allegation online',
            reason: 'Public posts can create new evidence and can be read out of context later.',
            severity: 'critical',
          },
          {
            action: 'Do NOT delete messages or call records',
            reason: 'Preserve the record exactly as it exists so later review is not undermined.',
            severity: 'critical',
          },
        );
      } else if (criminalContext === 'reporting-party') {
        avoidList.push(
          {
            action: 'Do NOT delete messages, photos, or call records',
            reason: 'Preserve the record exactly as it exists so the timeline stays credible and complete.',
            severity: 'critical',
          },
          {
            action: 'Do NOT post about the incident on social media',
            reason: 'Public comments can complicate credibility, privacy, and later witness issues.',
            severity: 'warning',
          },
        );

        if (this.hasSafetySupportSignal(narrativeText)) {
          avoidList.push({
            action: 'Do NOT confront the other person if there is an ongoing safety concern',
            reason: 'Direct confrontation can increase risk and can complicate the record if fear, threats, or ongoing contact are part of the facts.',
            severity: 'critical',
          });
        }
      } else if (criminalContext === 'civil-overlap') {
        avoidList.push(
          {
            action: 'Do NOT miss a civil filing deadline while waiting on the police process',
            reason: 'Police involvement does not automatically pause a separate civil case deadline.',
            severity: 'critical',
          },
          {
            action: 'Do NOT mix verified facts with allegations in filed material',
            reason: 'Keeping the record precise helps both the civil file and any later police review.',
            severity: 'critical',
          },
          {
            action: 'Do NOT post accusations publicly',
            reason: 'Public accusations can create new legal risk and make the chronology harder to manage.',
            severity: 'warning',
          },
        );
      } else {
        avoidList.push(
          {
            action: 'Do NOT delete messages, notices, or screenshots',
            reason: 'The fastest way to lose clarity is to lose the underlying record.',
            severity: 'critical',
          },
          {
            action: 'Do NOT assume police involvement stops every other deadline',
            reason: 'A housing, employment, or civil deadline can still keep running while the role remains unclear.',
            severity: 'critical',
          },
          {
            action: 'Do NOT send reactive messages while the facts are still unclear',
            reason: 'Reactive contact can complicate the record before you understand which process actually applies.',
            severity: 'warning',
          },
        );
      }
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
      const narrativeText = this.getNarrativeText(classification);
      const criminalContext = this.detectCriminalActionContext(narrativeText);

      if (criminalContext === 'reporting-party') {
        offers.push(
          {
            id: 'evidence-checklist',
            title: 'Incident Evidence Checklist',
            description: 'A checklist of the messages, photos, medical records, and witness details that strengthen a reported-incident file.',
            actionLabel: 'Get Evidence Checklist',
            documentType: 'criminal_evidence_checklist',
          },
          {
            id: 'complainant-role',
            title: 'What To Expect After Reporting',
            description: 'Understand what usually happens after a report, what a reporting witness does, and how court involvement is decided.',
            actionLabel: 'Learn What To Expect',
            documentType: 'complainant_role_guide',
          },
        );

        if (this.hasSafetySupportSignal(narrativeText)) {
          offers.push({
            id: 'victim-services-guide',
            title: 'Victim Support Services Guide',
            description: 'Get information about support services, updates, and safety-planning help that may be available after a reported incident.',
            actionLabel: 'View Support Guide',
            documentType: 'victim_services_guide',
          });
        }
      }
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
          title: 'Calculate My Severance Entitlement',
          description: 'Calculate both your ESA statutory minimums AND your estimated common law reasonable notice period based on age, position, length of service, and other factors.',
          actionLabel: 'Calculate Severance',
          documentType: 'severance_calculator',
        },
        {
          id: 'wrongful-dismissal-letter',
          title: 'Generate Wrongful Dismissal Demand Letter',
          description: 'A formal demand letter to your former employer asserting your common law notice entitlement and opening a settlement negotiation — the most common first step before a lawsuit.',
          actionLabel: 'Draft Demand Letter',
          documentType: 'wrongful_dismissal_demand',
        },
        {
          id: 'mol-complaint',
          title: 'Ministry of Labour Complaint Guide',
          description: 'Step-by-step guide to filing an Employment Standards Act complaint with the Ministry of Labour — covers termination pay, severance pay, vacation pay, and unpaid wages.',
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
