import { Domain, DomainModule } from '../models';

export class DomainModuleRegistry {
  private modules = new Map<Domain, DomainModule>();

  register(module: DomainModule): void {
    this.modules.set(module.domain, module);
  }

  get(domain: Domain): DomainModule | undefined {
    return this.modules.get(domain);
  }

  list(): DomainModule[] {
    return Array.from(this.modules.values());
  }
}
