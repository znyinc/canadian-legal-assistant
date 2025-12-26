import { BaseDomainModule } from './BaseDomainModule';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DomainModuleInput, DocumentDraft } from '../models';

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
  isApplicable(domain: string): boolean {
    return domain === 'criminal';
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
    const isUtteringThreats = notes.includes('threat') || notes.includes('uttering');
    const isAssault = notes.includes('assault') || notes.includes('violence');

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

    // Release conditions checklist
    if (templates['criminal/release_conditions_checklist']) {
      const partyName = classification.parties?.names?.[0] || 'Accused';
      const checklist = templateLib.renderTemplate('criminal/release_conditions_checklist', {
        date: new Date().toISOString().split('T')[0],
        fullName: partyName,
      });
      drafts.push(mkDraft('Release Conditions Checklist', [{ heading: 'Conditions', content: checklist }]));
    }

    // Victim impact statement scaffold (if applicable)
    if (isAssault && templates['criminal/victim_impact_scaffold']) {
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

    return drafts;
  }
}

