export class SourceAccessController {
    policies = new Map();
    logs = [];
    setPolicy(policy) {
        this.policies.set(policy.service, policy);
    }
    getPolicy(service) {
        return this.policies.get(service);
    }
    validateAccess(service, method) {
        const policy = this.policies.get(service);
        if (!policy) {
            this.log(service, method, false, 'No policy');
            return false;
        }
        const allowed = policy.allowedMethods.includes(method);
        this.log(service, method, allowed, allowed ? undefined : 'Method not allowed');
        return allowed;
    }
    validateSourceEntry(entry) {
        const errors = [];
        const policy = this.policies.get(entry.service);
        if (!policy)
            return { ok: false, errors: ['No policy'] };
        if (policy.rules?.enforceCurrencyDates && !entry.retrievalDate) {
            errors.push('Missing retrievalDate for currency enforcement');
        }
        if (entry.service === 'Justice Laws' && policy.rules?.enforceBilingualText && !entry.version) {
            // In practice version/bilingual checks might differ; keep simple requirement placeholder
            errors.push('Missing version for bilingual text enforcement');
        }
        return { ok: errors.length === 0, errors };
    }
    getLogs() {
        return this.logs.slice();
    }
    log(service, method, allowed, reason) {
        this.logs.push({ timestamp: new Date().toISOString(), service, method, allowed, reason });
    }
}
//# sourceMappingURL=SourceAccessController.js.map