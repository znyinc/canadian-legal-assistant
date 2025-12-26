export interface TimeAssessment {
    risk: 'low' | 'medium' | 'high';
    notes: string[];
}
export interface MunicipalNoticeDetection {
    required: boolean;
    message?: string;
}
export declare class TimelineAssessor {
    assess(dates: string[]): TimeAssessment;
    detectMunicipalNotice(matter: any, evidenceIndex?: any): MunicipalNoticeDetection;
}
//# sourceMappingURL=TimelineAssessor.d.ts.map