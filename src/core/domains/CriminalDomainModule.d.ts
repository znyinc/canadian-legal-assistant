import { BaseDomainModule } from './BaseDomainModule';
import { MatterClassification } from '../models';
/**
 * Criminal (info-only) domain module for assault and uttering threats.
 * Provides release conditions checklist, victim impact scaffold, and police/crown process guidance.
 *
 * Activation: classification.domain === 'criminal' and subCategory in ['assault', 'uttering-threats']
 */
export declare class CriminalDomainModule extends BaseDomainModule {
    readonly domain: "criminal";
    readonly name = "Criminal (Info-Only) Module";
    protected tags: string[];
    constructor();
    /**
     * Check if this module applies to the given classification
     */
    isApplicable(classification: MatterClassification): boolean;
    /**
     * Generate crime-specific documents
     */
    generateDocuments(classification: MatterClassification, _forumMap: any, _timelineEvents: any, evidenceManifest?: any, _journeyMap?: any): Promise<{
        drafts: any[];
        manifests: any[];
    }>;
}
//# sourceMappingURL=CriminalDomainModule.d.ts.map