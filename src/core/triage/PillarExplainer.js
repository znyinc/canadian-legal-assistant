export class PillarExplainer {
    explain(pillar, domain) {
        // Domain-specific nextSteps augmentation
        const domainNextSteps = (base, domain) => {
            if (!domain)
                return base;
            const d = domain.toLowerCase();
            if (d.includes('insurance')) {
                return [
                    ...base,
                    'Notify your insurer right away and ask for a claim number',
                    'Collect policy documents, photos, receipts, and repair estimates',
                    'Track deadlines for proofs of loss and appeals set out in the policy'
                ];
            }
            if (d.includes('landlord') || d.includes('ltb') || d.includes('tenant')) {
                return [
                    ...base,
                    'Document every communication with the landlord/tenant (dates, screenshots, letters)',
                    'Review Landlord and Tenant Board forms and rules for the remedy you need',
                    'Gather evidence of payments, notices given/received, and any safety issues'
                ];
            }
            if (d.includes('civil') || d.includes('small') || d.includes('negligence')) {
                return [
                    ...base,
                    'Calculate damages with receipts, invoices, and income loss proof',
                    'Send a concise demand letter with a deadline before issuing a claim',
                    'Organize photos, witness info, and timelines to support liability and damages'
                ];
            }
            return base;
        };
        switch (pillar) {
            case 'Criminal':
                return {
                    pillar,
                    burdenOfProof: 'Beyond a reasonable doubt (criminal standard).',
                    overview: 'Criminal matters involve allegations of offences against public law brought by the state. If you are a victim of a crime, contact police; this tool provides information, not legal advice.',
                    nextSteps: domainNextSteps(['Report to police if an offence occurred', 'Preserve evidence and get medical attention if needed'], domain)
                };
            case 'Civil':
                return {
                    pillar,
                    burdenOfProof: 'Balance of probabilities (civil standard).',
                    overview: 'Civil matters involve disputes between private parties, such as negligence or property damage. Civil claims focus on remedies like damages or specific performance.',
                    nextSteps: domainNextSteps(['Collect evidence (photos, receipts, witness info)', 'Consider demand letter or Small Claims Court for monetary relief'], domain)
                };
            case 'Administrative':
                return {
                    pillar,
                    burdenOfProof: 'Varies by tribunal, often a balance of probabilities or specialized statutory tests.',
                    overview: 'Administrative matters typically go to tribunals or regulatory bodies (e.g., LTB, HRTO). Procedures and remedies differ from courts.',
                    nextSteps: domainNextSteps(['Check tribunal eligibility and filing deadlines', 'Gather evidence aligned to tribunal rules'], domain)
                };
            case 'Quasi-Criminal':
                return {
                    pillar,
                    burdenOfProof: 'Often a lower burden; varies by statute (e.g., provincial offence standards).',
                    overview: 'Quasi-criminal matters include regulatory offences and by-law violations. These can have penalties but follow administrative/enforcement pathways.',
                    nextSteps: domainNextSteps(['Review by-law or statute for applicable procedures', 'Consider early resolution options or dispute mechanisms'], domain)
                };
            default:
                return {
                    pillar: 'Unknown',
                    burdenOfProof: 'Varies',
                    overview: 'The legal pillar could not be determined automatically. Consider providing more details or seek advice.',
                    nextSteps: domainNextSteps(['Provide more detail', 'Consult a lawyer or community legal clinic for complex matters'], domain)
                };
        }
    }
}
//# sourceMappingURL=PillarExplainer.js.map