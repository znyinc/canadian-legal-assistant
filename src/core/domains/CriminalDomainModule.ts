import { BaseDomainModule } from './BaseDomainModule';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentPackager } from '../documents/DocumentPackager';
import { MatterClassification, DocumentPackage, SourceManifest } from '../models';

/**
 * Criminal (info-only) domain module for assault and uttering threats.
 * Provides release conditions checklist, victim impact scaffold, and police/crown process guidance.
 * 
 * Activation: classification.domain === 'criminal' and subCategory in ['assault', 'uttering-threats']
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
   * Check if this module applies to the given classification
   */
  isApplicable(classification: MatterClassification): boolean {
    if (!classification || classification.domain !== 'criminal') return false;
    
    const subCat = (classification.subCategory || '').toLowerCase();
    return subCat.includes('assault') || subCat.includes('threat');
  }

  /**
   * Generate crime-specific documents
   */
  async generateDocuments(
    classification: MatterClassification,
    _forumMap: any,
    _timelineEvents: any,
    evidenceManifest?: any,
    _journeyMap?: any,
  ): Promise<{ drafts: any[]; manifests: any[] }> {
    const drafts: any[] = [];
    const manifests: any[] = [];

    const mkDraft = (title: string, sections: { heading: string; content: string }[]): any => {
      return {
        id: `draft-${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
        title,
        sections: sections.map((s) => ({ heading: s.heading, content: s.content, evidenceRefs: [], confirmed: false })),
        citations: [],
        disclaimer: undefined
      };
    };

    const templateLib = new TemplateLibrary();
    const templates = templateLib.domainTemplates();

    // Release conditions checklist
    if (templates['criminal/release_conditions_checklist']) {
      const checklist = templateLib.renderTemplate('criminal/release_conditions_checklist', {
        date: new Date().toISOString().split('T')[0],
        fullName: classification.partyName || 'Accused',
      });
      drafts.push(mkDraft('Release Conditions Checklist', [{ heading: 'Conditions', content: checklist }]));
    }

    // Victim impact statement scaffold
    if (templates['criminal/victim_impact_scaffold']) {
      const scaffold = templateLib.renderTemplate('criminal/victim_impact_scaffold', {
        date: new Date().toISOString().split('T')[0],
        victimRole: classification.claimantType || 'Victim',
      });
      drafts.push(mkDraft('Victim Impact Statement (Scaffold)', [{ heading: 'Impact Areas', content: scaffold }]));
    }

    // Police/crown process guidance
    if (templates['criminal/police_crown_process_guide']) {
      const guide = templateLib.renderTemplate('criminal/police_crown_process_guide', {
        offense: classification.subCategory === 'uttering-threats' ? 'uttering threats' : 'assault',
        province: 'Ontario',
      });
      drafts.push(mkDraft('Police and Crown Process Guide (Information)', [{ heading: 'Process', content: guide }]));
    }

    // Build evidence manifest if not provided
    if (!evidenceManifest) {
      evidenceManifest = this.buildEvidenceManifest([]);
    }

    // Package documents
    const packager = new DocumentPackager();
    const sourceManifest: SourceManifest = {
      sources: [],
      accessLog: [],
      compiledAt: new Date(),
    };

    const packageOutput = packager.assemble({
      packageName: `criminal-${classification.subCategory}`,
      forumMap: '# Criminal Justice System Overview\n\nCanadian criminal law information.',
      timeline: '# Timeline\n\nNo events recorded.',
      missingEvidenceChecklist: '# Missing Evidence\n\nNone identified.',
      drafts,
      sourceManifest,
      evidenceManifest,
    });

    manifests.push(packageOutput.evidenceManifest);
    return { drafts, manifests };
  }
}
