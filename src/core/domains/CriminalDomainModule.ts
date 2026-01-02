import { BaseDomainModule } from './BaseDomainModule';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DomainModuleInput, DocumentDraft, EvidenceIndex, EvidenceManifest, MatterClassification } from '../models';

/**
 * Criminal (info-only) domain module for assault and uttering threats.
 * Provides release conditions checklist, victim impact scaffold, and police/crown process guidance.
 * 
 * Activation: classification.domain === 'criminal' and notes contain assault/threat keywords
 */
export class CriminalDomainModule extends BaseDomainModule {
  readonly domain = 'criminal' as const;
  readonly name = 'Criminal (Info-Only) Module';
  protected tags = [
    'Assault offences',
    'Uttering threats',
    'Criminal charges',
  ];

  constructor() {
    super();
  }

  /**
   * Check if this module applies to the given domain
   */
  isApplicable(input: { domain?: string; subCategory?: string } | string): boolean {
    const domain = typeof input === 'string' ? input : input.domain;
    const sub = typeof input === 'string' ? undefined : input.subCategory;
    if (domain !== 'criminal') return false;
    if (!sub) return true;
    return sub === 'assault' || sub === 'uttering-threats';
  }

  /**
   * Backward-compatible generator used by legacy tests. Normalizes inputs and delegates to buildDrafts.
   */
  async generateDocuments(
    classification: Partial<MatterClassification>,
    _forumMap: any = {},
    evidenceIndex: any = [],
    evidenceManifest?: Partial<EvidenceManifest>
  ): Promise<{ drafts: DocumentDraft[]; manifests: Array<{ items: unknown[] }> }> {
    const now = new Date().toISOString();
    const index: EvidenceIndex = Array.isArray(evidenceIndex)
      ? { items: [], generatedAt: now, sourceManifest: { entries: [], compiledAt: now } }
      : {
          items: evidenceIndex.items ?? [],
          generatedAt: evidenceIndex.generatedAt ?? now,
          sourceManifest:
            evidenceIndex.sourceManifest ?? ({ entries: [], compiledAt: now } as EvidenceIndex['sourceManifest'])
        };

    const normalizedClassification: MatterClassification & { subCategory?: string } = {
      id: classification.id ?? 'criminal-matter',
      domain: 'criminal',
      jurisdiction: classification.jurisdiction ?? 'Ontario',
      parties: classification.parties ?? {
        claimantType: 'individual',
        respondentType: 'government',
        names: (classification as any).partyName ? [(classification as any).partyName] : undefined
      },
      subCategory: (classification as any).subCategory,
      notes: classification.notes ?? [],
      timeline: classification.timeline,
      urgency: classification.urgency,
      disputeAmount: classification.disputeAmount
    };

    const input: DomainModuleInput = {
      classification: normalizedClassification,
      forumMap: '',
      timeline: '',
      missingEvidence: '',
      evidenceIndex: index,
      sourceManifest: index.sourceManifest,
      evidenceManifest: evidenceManifest
        ? {
            items: evidenceManifest.items ?? [],
            compiledAt: typeof evidenceManifest.compiledAt === 'string'
              ? evidenceManifest.compiledAt
              : (evidenceManifest.compiledAt as Date | undefined)?.toISOString() ?? now
          }
        : undefined
    };

    const drafts = this.buildDrafts(input);
    const manifests = [
      {
        items: evidenceManifest?.items ?? [],
      }
    ];

    return { drafts, manifests };
  }

  /**
   * Build crime-specific draft documents
   */
  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const drafts: DocumentDraft[] = [];
    const classification = input.classification;
    
    if (!classification || classification.domain !== 'criminal') {
      return drafts;
    }

    const templateLib = new TemplateLibrary();
    const templates = templateLib.domainTemplates();
    const notes = (classification.notes || []).join(' ').toLowerCase();
    const subCategory = (classification as any).subCategory as string | undefined;
    const isUtteringThreats = subCategory === 'uttering-threats' || notes.includes('threat') || notes.includes('uttering');
    const isAssault = subCategory === 'assault' || notes.includes('assault') || notes.includes('violence');

    // Helper to create document draft
    const mkDraft = (title: string, sections: { heading: string; content: string }[]): DocumentDraft => {
      return {
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title,
        sections: sections.map((s) => ({ 
          heading: s.heading, 
          content: s.content, 
          evidenceRefs: [], 
          confirmed: false 
        })),
        citations: [],
        disclaimer: undefined,
        missingConfirmations: []
      };
    };

    // Determine which documents are needed based on case context
    const isVictim = notes.includes('victim') || notes.includes('complainant');
    const isAccused = notes.includes('accused') || notes.includes('defendant') || notes.includes('charged');
    
    // Release conditions checklist (ONLY if user is accused/defendant)
    if (isAccused && templates['criminal/release_conditions_checklist']) {
      const partyName = classification.parties?.names?.[0] || 'Accused';
      const checklist = templateLib.renderTemplate('criminal/release_conditions_checklist', {
        date: new Date().toISOString().split('T')[0],
        fullName: partyName,
      });
      drafts.push(mkDraft('Release Conditions Checklist', [{ heading: 'Conditions', content: checklist }]));
    }

    // Victim impact statement scaffold (ONLY if victim/complainant in assault case)
    if (isVictim && isAssault && templates['criminal/victim_impact_scaffold']) {
      const scaffold = templateLib.renderTemplate('criminal/victim_impact_scaffold', {
        date: new Date().toISOString().split('T')[0],
        victimRole: 'Victim',
      });
      drafts.push(mkDraft('Victim Impact Statement (Scaffold)', [{ heading: 'Impact Areas', content: scaffold }]));
    }

    // Police/crown process guidance
    if (templates['criminal/police_crown_process_guide']) {
      const offense = isUtteringThreats ? 'uttering threats' : 'assault';
      const guide = templateLib.renderTemplate('criminal/police_crown_process_guide', {
        offense,
        province: 'Ontario',
      });
      drafts.push(mkDraft('Police and Crown Process Guide (Information)', [{ heading: 'Process', content: guide }]));
    }

    // Victim Services Ontario guidance (always include for victims)
    if (templates['criminal/victim_services_guide']) {
      const victimGuide = templateLib.renderTemplate('criminal/victim_services_guide', {});
      drafts.push(mkDraft('Victim Services Ontario — Support Resources', [{ heading: 'Support', content: victimGuide }]));
    }

    // Criminal evidence checklist (always include)
    if (templates['criminal/evidence_checklist']) {
      const evidenceChecklist = templateLib.renderTemplate('criminal/evidence_checklist', {});
      drafts.push(mkDraft('Evidence Checklist for Criminal Complainant', [{ heading: 'Evidence', content: evidenceChecklist }]));
    }

    // Complainant role explained (always include)
    if (templates['criminal/complainant_role_explained']) {
      const roleGuide = templateLib.renderTemplate('criminal/complainant_role_explained', {});
      drafts.push(mkDraft('Your Role as Complainant — What to Expect', [{ heading: 'Your Role', content: roleGuide }]));
    }

    // Criminal case next steps checklist (10-step comprehensive guide)
    if (templates['criminal/next_steps_checklist']) {
      const checklist = templateLib.renderTemplate('criminal/next_steps_checklist', {});
      drafts.push(mkDraft('Criminal Case — 10-Step Next Steps Checklist', [{ heading: 'What to Do Next', content: checklist }]));
    }

    return drafts;
  }
}

