import { MatterClassification } from '../models';
export type JourneyStage = 'Understand' | 'Options' | 'Prepare' | 'Act' | 'Resolve';
export type JourneyStatus = 'pending' | 'active' | 'done';
export interface JourneyStep {
    id: JourneyStage;
    label: string;
    status: JourneyStatus;
    nextSteps: string[];
}
export interface JourneyProgress {
    currentStage: JourneyStage;
    percentComplete: number;
    steps: JourneyStep[];
}
interface JourneyContext {
    classification?: Partial<MatterClassification>;
    forumMap?: any;
    evidenceCount?: number;
    documentsGenerated?: boolean;
}
export declare class JourneyTracker {
    buildProgress(ctx: JourneyContext): JourneyProgress;
    private markDone;
}
export {};
//# sourceMappingURL=JourneyTracker.d.ts.map