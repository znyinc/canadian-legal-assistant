import { CitationEnforcer } from '../upl/CitationEnforcer';
import { DisclaimerService } from '../upl/DisclaimerService';
import { StyleGuide } from '../templates/StyleGuide';
import {
  Citation,
  DocumentDraft,
  DraftSection,
  EvidenceIndex,
  EvidenceReference,
  SourceEntry
} from '../models';

export interface DraftingInput {
  title: string;
  sections: DraftSection[];
  evidenceIndex: EvidenceIndex;
  jurisdiction?: string;
  audience?: 'self-represented' | 'lawyer' | 'advocate';
  includeDisclaimer?: boolean;
  requireConfirmations?: boolean;
}

export class DocumentDraftingEngine {
  private styleGuide: StyleGuide;
  private disclaimerService: DisclaimerService;
  private citationEnforcer: CitationEnforcer;

  constructor(options?: {
    styleGuide?: StyleGuide;
    disclaimerService?: DisclaimerService;
    citationEnforcer?: CitationEnforcer;
  }) {
    this.styleGuide = options?.styleGuide ?? new StyleGuide();
    this.disclaimerService = options?.disclaimerService ?? new DisclaimerService();
    this.citationEnforcer = options?.citationEnforcer ?? new CitationEnforcer();
  }

  createDraft(input: DraftingInput): DocumentDraft {
    const sections = input.sections.map((section) => this.validateSection(section, input.evidenceIndex));
    const disclaimer =
      input.includeDisclaimer === false
        ? undefined
        : this.disclaimerService.legalInformationDisclaimer({
            jurisdiction: input.jurisdiction,
            audience: input.audience,
            domain: undefined
          });

    const citations = this.buildCitations(sections, input.evidenceIndex);
    const citationWarnings = this.collectCitationWarnings(sections, citations);
    const styleWarnings = this.collectStyleWarnings(sections, citations);
    const missingConfirmations = this.collectMissingConfirmations(sections, input.requireConfirmations);

    return {
      id: `draft-${Date.now()}`,
      title: input.title,
      sections,
      disclaimer,
      citations,
      styleWarnings: styleWarnings.length ? styleWarnings : undefined,
      citationWarnings: citationWarnings.length ? citationWarnings : undefined,
      missingConfirmations: missingConfirmations.length ? missingConfirmations : undefined
    };
  }

  private validateSection(section: DraftSection, evidenceIndex: EvidenceIndex): DraftSection {
    const refs: EvidenceReference[] = section.evidenceRefs.map((ref) => this.hydrateReference(ref, evidenceIndex));
    return { ...section, evidenceRefs: refs };
  }

  private hydrateReference(ref: EvidenceReference, evidenceIndex: EvidenceIndex): EvidenceReference {
    const itemIndex = evidenceIndex.items.findIndex((item) => item.id === ref.evidenceId);
    if (itemIndex === -1) {
      return { ...ref, description: ref.description || 'Unmatched evidence reference' };
    }
    const evidenceItem = evidenceIndex.items[itemIndex];
    const attachmentIndex = itemIndex + 1; // 1-based attachment numbering
    return {
      ...ref,
      attachmentIndex,
      timestamp: ref.timestamp || evidenceItem.date,
      description: ref.description || evidenceItem.summary
    };
  }

  private buildCitations(sections: DraftSection[], evidenceIndex: EvidenceIndex): Citation[] {
    const citations: Citation[] = [];
    const sources =
      (evidenceIndex.sourceManifest as any)?.entries || (evidenceIndex.sourceManifest as any)?.sources || [];

    sections.forEach((section) => {
      section.evidenceRefs.forEach((ref) => {
        const source = this.pickSourceForEvidence(sources);
        if (!source) return;
        citations.push({
          label: `Attachment ${ref.attachmentIndex ?? ref.evidenceId}`,
          url: source.url,
          retrievalDate: source.retrievalDate,
          source: source.service,
          evidenceId: ref.evidenceId
        });
      });
    });

    return citations;
  }

  private pickSourceForEvidence(sources: SourceEntry[]): SourceEntry | undefined {
    // Prefer CanLII then e-Laws then Justice Laws as a deterministic order
    const priority = ['CanLII', 'e-Laws', 'Justice Laws'] as const;
    return priority
      .map((svc) => sources.find((s) => s.service === svc))
      .find((entry): entry is SourceEntry => Boolean(entry));
  }

  private collectStyleWarnings(sections: DraftSection[], citations: Citation[]): string[] {
    const text = sections.map((s) => s.content).join(' ');
    const styleCheck = this.styleGuide.check(text);
    const citationCheck = this.citationEnforcer.ensureCitations(text, citations.length > 0);
    return [...(styleCheck.warnings || []), ...citationCheck.warnings];
  }

  private collectCitationWarnings(sections: DraftSection[], citations: Citation[]): string[] {
    const text = sections.map((s) => s.content).join(' ');
    const citationCheck = this.citationEnforcer.ensureCitations(text, citations.length > 0);
    return [...citationCheck.errors, ...citationCheck.warnings];
  }

  private collectMissingConfirmations(sections: DraftSection[], requireConfirmations?: boolean): string[] {
    if (requireConfirmations === false) return [];
    return sections
      .filter((s) => !s.confirmed)
      .map((s) => `Section "${s.heading}" lacks user confirmation for factual assertions.`);
  }
}
