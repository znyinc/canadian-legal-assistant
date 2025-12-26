export class DisclaimerService {
    legalInformationDisclaimer(ctx) {
        const jurisdiction = ctx.jurisdiction || 'Ontario (verify for your province/territory)';
        return [
            'This tool provides legal information, not legal advice.',
            `Applicability: primarily for ${jurisdiction}.`,
            'Decisions remain yours; consult a lawyer or licensed paralegal for advice.',
            'Outputs must be verified against current law and your facts.',
            'Sensitive data should be redacted before sharing.'
        ].join(' ');
    }
    multiPathwayPresentation(options) {
        if (!options.length)
            return 'No pathways available; gather more facts or seek legal advice.';
        return options
            .map((opt, i) => {
            const steps = opt.steps.map((s, idx) => `${idx + 1}. ${s}`).join(' ');
            const caveats = opt.caveats?.length ? ` Caveats: ${opt.caveats.join(' ')}` : '';
            return `${i + 1}) ${opt.label}: ${steps}.${caveats}`;
        })
            .join(' ');
    }
    redirectAdviceRequest(userText) {
        const advisoryPatterns = /(what should I do|can you advise|tell me what to file|should I sue)/i;
        if (advisoryPatterns.test(userText)) {
            return {
                redirected: true,
                message: 'I cannot provide legal advice. Here are informational options you may consider: internal complaint, tribunal/court intake, ombuds/appeal/judicial review. Confirm which applies and seek legal counsel as needed.'
            };
        }
        return { redirected: false, message: 'Proceed with information-only guidance.' };
    }
}
//# sourceMappingURL=DisclaimerService.js.map