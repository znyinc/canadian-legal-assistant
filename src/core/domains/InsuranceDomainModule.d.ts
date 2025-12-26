import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';
export declare class InsuranceDomainModule extends BaseDomainModule {
    domain: "insurance";
    protected buildDrafts(input: DomainModuleInput): DocumentDraft[];
    private detectMotorVehicleAccident;
    private buildMotorVehicleDocuments;
}
//# sourceMappingURL=InsuranceDomainModule.d.ts.map