import { CitationEnforcer } from '../upl/CitationEnforcer';
import { DisclaimerService } from '../upl/DisclaimerService';
import { StyleGuide } from '../templates/StyleGuide';
export class DocumentDraftingEngine {
    styleGuide;
    disclaimerService;
    citationEnforcer;
    constructor(options) {
        this.styleGuide = options?.styleGuide ?? new StyleGuide();
        this.disclaimerService = options?.disclaimerService ?? new DisclaimerService();
        this.citationEnforcer = options?.citationEnforcer ?? new CitationEnforcer();
    }
    createDraft(input) {
        const sections = input.sections.map((section) => this.validateSection(section, input.evidenceIndex));
        const disclaimer = input.includeDisclaimer === false
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
    validateSection(section, evidenceIndex) {
        const refs = section.evidenceRefs.map((ref) => this.hydrateReference(ref, evidenceIndex));
        return { ...section, evidenceRefs: refs };
    }
    hydrateReference(ref, evidenceIndex) {
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
    buildCitations(sections, evidenceIndex) {
        const citations = [];
        const sources = evidenceIndex.sourceManifest?.sources || [];
        sections.forEach((section) => {
            section.evidenceRefs.forEach((ref) => {
                const source = this.pickSourceForEvidence(sources);
                if (!source)
                    return;
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
    pickSourceForEvidence(sources) {
        // Prefer CanLII then e-Laws then Justice Laws as a deterministic order
        const priority = ['CanLII', 'e-Laws', 'Justice Laws'];
        return priority
            .map((svc) => sources.find((s) => s.service === svc))
            .find((entry) => Boolean(entry));
    }
    collectStyleWarnings(sections, citations) {
        const text = sections.map((s) => s.content).join(' ');
        const styleCheck = this.styleGuide.check(text);
        const citationCheck = this.citationEnforcer.ensureCitations(text, citations.length > 0);
        return [...(styleCheck.warnings || []), ...citationCheck.warnings];
    }
    collectCitationWarnings(sections, citations) {
        const text = sections.map((s) => s.content).join(' ');
        const citationCheck = this.citationEnforcer.ensureCitations(text, citations.length > 0);
        return [...citationCheck.errors, ...citationCheck.warnings];
    }
    collectMissingConfirmations(sections, requireConfirmations) {
        if (requireConfirmations === false)
            return [];
        return sections
            .filter((s) => !s.confirmed)
            .map((s) => `Section "${s.heading}" lacks user confirmation for factual assertions.`);
    }
}
//# sourceMappingURL=DocumentDraftingEngine.js.map