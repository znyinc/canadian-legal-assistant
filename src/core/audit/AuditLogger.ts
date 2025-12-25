import { AuditEvent, AuditEventType } from '../models';

export class AuditLogger {
  private events: AuditEvent[] = [];

  log(type: AuditEventType, actor: string, message: string, details?: Record<string, unknown>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      timestamp: new Date().toISOString(),
      actor,
      message,
      details
    };
    this.events.push(event);
    return event;
  }

  entries(): AuditEvent[] {
    return [...this.events];
  }

  filterByType(type: AuditEventType): AuditEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  clear(): void {
    this.events = [];
  }
}
