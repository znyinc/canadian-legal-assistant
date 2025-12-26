import { AuditLogger } from '../audit/AuditLogger';
export class DataLifecycleManager {
    audit;
    retention;
    constructor(auditLogger, defaultRetentionDays = 60) {
        this.audit = auditLogger ?? new AuditLogger();
        this.retention = {
            days: defaultRetentionDays,
            legalHold: false,
            updatedAt: new Date().toISOString()
        };
    }
    getRetention() {
        return this.retention;
    }
    updateRetention(days, actor) {
        this.retention = {
            ...this.retention,
            days,
            updatedAt: new Date().toISOString()
        };
        this.audit.log('retention-update', actor, `Retention updated to ${days} days.`);
        return this.retention;
    }
    applyLegalHold(actor, reason) {
        this.retention = {
            ...this.retention,
            legalHold: true,
            legalHoldReason: reason,
            updatedAt: new Date().toISOString()
        };
        this.audit.log('legal-hold', actor, 'Legal hold applied.', { reason });
        return this.retention;
    }
    clearLegalHold(actor) {
        this.retention = {
            ...this.retention,
            legalHold: false,
            legalHoldReason: undefined,
            updatedAt: new Date().toISOString()
        };
        this.audit.log('legal-hold', actor, 'Legal hold cleared.');
        return this.retention;
    }
    exportData(req) {
        const result = {
            exportedAt: new Date().toISOString(),
            items: req.items,
            manifest: req.manifest
        };
        this.audit.log('export', req.actor, 'Data export requested.', { items: req.items });
        return result;
    }
    requestDeletion(req) {
        if (this.retention.legalHold || req.legalHold) {
            this.audit.log('deletion', req.actor, 'Deletion blocked due to legal hold.', {
                items: req.items,
                reason: req.reason || this.retention.legalHoldReason
            });
            return {
                deletedAt: new Date().toISOString(),
                items: req.items,
                legalHoldApplied: true,
                status: 'blocked',
                reason: req.reason || this.retention.legalHoldReason
            };
        }
        this.audit.log('deletion', req.actor, 'Deletion completed.', { items: req.items });
        return {
            deletedAt: new Date().toISOString(),
            items: req.items,
            legalHoldApplied: false,
            status: 'completed'
        };
    }
    auditLog() {
        return this.audit.entries();
    }
}
//# sourceMappingURL=DataLifecycleManager.js.map