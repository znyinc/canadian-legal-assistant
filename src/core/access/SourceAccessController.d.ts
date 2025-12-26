import { AccessMethod, SourceAccessPolicy, SourceEntry } from '../models';
export interface AccessLogEntry {
    timestamp: string;
    service: SourceAccessPolicy['service'];
    method: AccessMethod;
    allowed: boolean;
    reason?: string;
}
export declare class SourceAccessController {
    private policies;
    private logs;
    setPolicy(policy: SourceAccessPolicy): void;
    getPolicy(service: SourceAccessPolicy['service']): SourceAccessPolicy | undefined;
    validateAccess(service: SourceAccessPolicy['service'], method: AccessMethod): boolean;
    validateSourceEntry(entry: SourceEntry): {
        ok: boolean;
        errors: string[];
    };
    getLogs(): AccessLogEntry[];
    private log;
}
//# sourceMappingURL=SourceAccessController.d.ts.map