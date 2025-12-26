import { BaseDomainModule } from './BaseDomainModule';
export class LandlordTenantDomainModule extends BaseDomainModule {
    domain = 'landlordTenant';
    buildDrafts(input) {
        const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
        const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];
        const mkDraft = (title, summary, confirmedFacts) => {
            const sections = [
                {
                    heading: 'Facts',
                    content: `${summary} See attached timeline for key dates and supporting evidence references.`,
                    evidenceRefs: refs,
                    confirmed: confirmedFacts
                },
                {
                    heading: 'Requests',
                    content: 'Sets out requested actions consistent with LTB processes (confirm before filing).',
                    evidenceRefs: [],
                    confirmed: false
                },
                {
                    heading: 'Next Steps',
                    content: 'This draft is informational; confirm correctness and file the appropriate LTB form or notice.',
                    evidenceRefs: [],
                    confirmed: true
                }
            ];
            return this.drafting.createDraft({
                title,
                sections,
                evidenceIndex: input.evidenceIndex,
                jurisdiction: input.classification.jurisdiction,
                requireConfirmations: true
            });
        };
        return [
            mkDraft('LTB Intake Checklist', 'Captures tenancy details, rent amounts, and issues for LTB intake.', true),
            mkDraft('Notice to Resolve Issue', 'Outlines the issue and requests resolution before formal LTB filing.', false),
            mkDraft('Evidence Pack Cover', 'Summarizes attachments for an LTB hearing or mediation.', true)
        ];
    }
}
//# sourceMappingURL=LandlordTenantDomainModule.js.map