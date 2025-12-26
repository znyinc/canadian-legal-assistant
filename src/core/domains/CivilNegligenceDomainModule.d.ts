import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';
export declare class CivilNegligenceDomainModule extends BaseDomainModule {
    domain: "civil-negligence";
    supportsMatter(matter: any): boolean;
    protected buildDrafts(input: DomainModuleInput): DocumentDraft[];
}
//# sourceMappingURL=CivilNegligenceDomainModule.d.ts.map