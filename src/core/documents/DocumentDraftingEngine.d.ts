import { CitationEnforcer } from '../upl/CitationEnforcer';
import { DisclaimerService } from '../upl/DisclaimerService';
import { StyleGuide } from '../templates/StyleGuide';
import { DocumentDraft, DraftSection, EvidenceIndex } from '../models';
export interface DraftingInput {
    title: string;
    sections: DraftSection[];
    evidenceIndex: EvidenceIndex;
    jurisdiction?: string;
    audience?: 'self-represented' | 'lawyer' | 'advocate';
    includeDisclaimer?: boolean;
    requireConfirmations?: boolean;
}
export declare class DocumentDraftingEngine {
    private styleGuide;
    private disclaimerService;
    private citationEnforcer;
    constructor(options?: {
        styleGuide?: StyleGuide;
        disclaimerService?: DisclaimerService;
        citationEnforcer?: CitationEnforcer;
    });
    createDraft(input: DraftingInput): DocumentDraft;
    private validateSection;
    private hydrateReference;
    private buildCitations;
    private pickSourceForEvidence;
    private collectStyleWarnings;
    private collectCitationWarnings;
    private collectMissingConfirmations;
}
//# sourceMappingURL=DocumentDraftingEngine.d.ts.map