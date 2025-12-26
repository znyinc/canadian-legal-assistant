export class DomainModuleRegistry {
    modules = new Map();
    register(module) {
        this.modules.set(module.domain, module);
    }
    get(domain) {
        return this.modules.get(domain);
    }
    list() {
        return Array.from(this.modules.values());
    }
}
//# sourceMappingURL=DomainModuleRegistry.js.map