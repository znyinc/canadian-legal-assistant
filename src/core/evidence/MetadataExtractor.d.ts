import { EvidenceType } from '../models';
export interface EvidenceMetadata {
    date?: string;
    sender?: string;
    recipient?: string;
    subject?: string;
    summary?: string;
}
export declare function extractMetadata(type: EvidenceType, content: Buffer): EvidenceMetadata;
//# sourceMappingURL=MetadataExtractor.d.ts.map