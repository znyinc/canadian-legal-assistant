import { Domain, DomainModule } from '../models';
export declare class DomainModuleRegistry {
    private modules;
    register(module: DomainModule): void;
    get(domain: Domain): DomainModule | undefined;
    list(): DomainModule[];
}
//# sourceMappingURL=DomainModuleRegistry.d.ts.map