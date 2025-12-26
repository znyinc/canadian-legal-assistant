export class CitationFormatter {
    formatCase(meta) {
        const date = meta.decisionDate;
        const cite = meta.citation ? `${meta.citation}` : `${meta.court} (${date})`;
        return `${meta.title}, ${cite} (${meta.url}, retrieved ${new Date().toISOString().split('T')[0]})`;
    }
    formatStatute(stat) {
        const base = `${stat.title}${stat.provision ? ', ' + stat.provision : ''}`;
        const juris = stat.jurisdiction === 'Federal' ? 'Justice Laws' : 'e-Laws';
        const bilingual = stat.jurisdiction === 'Federal' || stat.bilingual ? ' (bilingual text available)' : '';
        return `${base} (${juris}, ${stat.url}, retrieved ${stat.retrievalDate})${bilingual}`;
    }
}
//# sourceMappingURL=CitationFormatter.js.map