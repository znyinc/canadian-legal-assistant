export class AuditLogger {
    events = [];
    log(type, actor, message, details) {
        const event = {
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
    entries() {
        return [...this.events];
    }
    filterByType(type) {
        return this.events.filter((e) => e.type === type);
    }
    clear() {
        this.events = [];
    }
}
//# sourceMappingURL=AuditLogger.js.map