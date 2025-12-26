import { AuditEvent, AuditEventType } from '../models';
export declare class AuditLogger {
    private events;
    log(type: AuditEventType, actor: string, message: string, details?: Record<string, unknown>): AuditEvent;
    entries(): AuditEvent[];
    filterByType(type: AuditEventType): AuditEvent[];
    clear(): void;
}
//# sourceMappingURL=AuditLogger.d.ts.map