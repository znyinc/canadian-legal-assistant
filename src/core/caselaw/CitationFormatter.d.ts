import { CaseMetadata } from './CanLiiClient';
export interface StatuteCitation {
    jurisdiction: 'Ontario' | 'Federal';
    title: string;
    provision?: string;
    url: string;
    retrievalDate: string;
    bilingual?: boolean;
}
export declare class CitationFormatter {
    formatCase(meta: CaseMetadata): string;
    formatStatute(stat: StatuteCitation): string;
}
//# sourceMappingURL=CitationFormatter.d.ts.map