import { AccessMethod, SourceAccessPolicy, SourceEntry } from '../models';

export interface AccessLogEntry {
  timestamp: string; // ISO date
  service: SourceAccessPolicy['service'];
  method: AccessMethod;
  allowed: boolean;
  reason?: string;
}

export class SourceAccessController {
  private policies: Map<SourceAccessPolicy['service'], SourceAccessPolicy> = new Map();
  private logs: AccessLogEntry[] = [];

  setPolicy(policy: SourceAccessPolicy): void {
    this.policies.set(policy.service, policy);
  }

  getPolicy(service: SourceAccessPolicy['service']): SourceAccessPolicy | undefined {
    return this.policies.get(service);
  }

  validateAccess(service: SourceAccessPolicy['service'], method: AccessMethod): boolean {
    const policy = this.policies.get(service);
    if (!policy) {
      this.log(service, method, false, 'No policy');
      return false;
    }
    const allowed = policy.allowedMethods.includes(method);
    this.log(service, method, allowed, allowed ? undefined : 'Method not allowed');
    return allowed;
  }

  validateSourceEntry(entry: SourceEntry): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.policies.get(entry.service);
    if (!policy) return { ok: false, errors: ['No policy'] };

    if (policy.rules?.enforceCurrencyDates && !entry.retrievalDate) {
      errors.push('Missing retrievalDate for currency enforcement');
    }
    if (entry.service === 'Justice Laws' && policy.rules?.enforceBilingualText && !entry.version) {
      // In practice version/bilingual checks might differ; keep simple requirement placeholder
      errors.push('Missing version for bilingual text enforcement');
    }
    return { ok: errors.length === 0, errors };
  }

  getLogs(): AccessLogEntry[] {
    return this.logs.slice();
  }

  private log(service: SourceAccessPolicy['service'], method: AccessMethod, allowed: boolean, reason?: string) {
    this.logs.push({ timestamp: new Date().toISOString(), service, method, allowed, reason });
  }
}
