const advisoryTerms = /(recommend|should|advise you to|we suggest|you must|guarantee)/i;
export class CitationEnforcer {
    ensureCitations(text, hasCitation) {
        const errors = [];
        const warnings = [];
        if (!hasCitation) {
            errors.push('Uncited legal statement detected: provide authoritative source or omit.');
        }
        if (advisoryTerms.test(text)) {
            warnings.push('Language appears advisory; use factual, restrained wording.');
        }
        if (/"/.test(text) && !hasCitation) {
            warnings.push('Quoted material without citation; add source and retrieval date.');
        }
        return { ok: errors.length === 0, errors, warnings };
    }
    verifyRetrieval(retrievalDate) {
        if (!retrievalDate) {
            return {
                ok: false,
                errors: ['Missing retrieval/currency date for cited source.'],
                warnings: []
            };
        }
        return { ok: true, errors: [], warnings: [] };
    }
}
//# sourceMappingURL=CitationEnforcer.js.map