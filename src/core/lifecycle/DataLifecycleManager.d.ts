import { AuditLogger } from '../audit/AuditLogger';
import { DeletionResult, ExportResult, RetentionPolicy, SourceManifest } from '../models';
export interface ExportRequest {
    actor: string;
    items: string[];
    manifest: SourceManifest;
}
export interface DeletionRequest {
    actor: string;
    items: string[];
    legalHold?: boolean;
    reason?: string;
}
export declare class DataLifecycleManager {
    private audit;
    private retention;
    constructor(auditLogger?: AuditLogger, defaultRetentionDays?: number);
    getRetention(): RetentionPolicy;
    updateRetention(days: number, actor: string): RetentionPolicy;
    applyLegalHold(actor: string, reason: string): RetentionPolicy;
    clearLegalHold(actor: string): RetentionPolicy;
    exportData(req: ExportRequest): ExportResult;
    requestDeletion(req: DeletionRequest): DeletionResult;
    auditLog(): import("../models").AuditEvent[];
}
//# sourceMappingURL=DataLifecycleManager.d.ts.map