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

export class DataLifecycleManager {
  private audit: AuditLogger;
  private retention: RetentionPolicy;

  constructor(auditLogger?: AuditLogger, defaultRetentionDays = 60) {
    this.audit = auditLogger ?? new AuditLogger();
    this.retention = {
      days: defaultRetentionDays,
      legalHold: false,
      updatedAt: new Date().toISOString()
    };
  }

  getRetention(): RetentionPolicy {
    return this.retention;
  }

  updateRetention(days: number, actor: string): RetentionPolicy {
    this.retention = {
      ...this.retention,
      days,
      updatedAt: new Date().toISOString()
    };
    this.audit.log('retention-update', actor, `Retention updated to ${days} days.`);
    return this.retention;
  }

  applyLegalHold(actor: string, reason: string): RetentionPolicy {
    this.retention = {
      ...this.retention,
      legalHold: true,
      legalHoldReason: reason,
      updatedAt: new Date().toISOString()
    };
    this.audit.log('legal-hold', actor, 'Legal hold applied.', { reason });
    return this.retention;
  }

  clearLegalHold(actor: string): RetentionPolicy {
    this.retention = {
      ...this.retention,
      legalHold: false,
      legalHoldReason: undefined,
      updatedAt: new Date().toISOString()
    };
    this.audit.log('legal-hold', actor, 'Legal hold cleared.');
    return this.retention;
  }

  exportData(req: ExportRequest): ExportResult {
    const result: ExportResult = {
      exportedAt: new Date().toISOString(),
      items: req.items,
      manifest: req.manifest
    };
    this.audit.log('export', req.actor, 'Data export requested.', { items: req.items });
    return result;
  }

  requestDeletion(req: DeletionRequest): DeletionResult {
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
