import { EvidenceIndex, EvidenceType } from '../models';
export interface TimelineEntry {
    date: string;
    itemId: string;
    filename: string;
    type: EvidenceType;
    summary?: string;
}
export interface TimelineGap {
    start: string;
    end: string;
    durationDays: number;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface MissingEvidenceAlert {
    type: 'screenshot' | 'email-original' | 'audio-video' | 'unknown';
    message: string;
}
export declare class TimelineGenerator {
    generate(index: EvidenceIndex): TimelineEntry[];
    detectGaps(timeline: TimelineEntry[]): TimelineGap[];
    flagMissingEvidence(index: EvidenceIndex, timeline: TimelineEntry[]): MissingEvidenceAlert[];
}
//# sourceMappingURL=TimelineGenerator.d.ts.map