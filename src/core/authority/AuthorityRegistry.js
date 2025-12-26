export class AuthorityRegistry {
    authorities = new Map();
    add(authority) {
        this.authorities.set(authority.id, authority);
    }
    update(authority) {
        if (!this.authorities.has(authority.id)) {
            throw new Error(`Authority ${authority.id} not found`);
        }
        this.authorities.set(authority.id, authority);
    }
    getById(id) {
        return this.authorities.get(id);
    }
    list() {
        return Array.from(this.authorities.values());
    }
    needsUpdate(id, now = new Date()) {
        const auth = this.authorities.get(id);
        if (!auth)
            return false;
        const last = new Date(auth.updatedAt).getTime();
        const nextDue = last + auth.updateCadenceDays * 24 * 60 * 60 * 1000;
        return now.getTime() >= nextDue;
    }
    getEscalationRoute(id) {
        const auth = this.authorities.get(id);
        if (!auth)
            return [];
        return auth.escalationRoutes
            .map((eid) => this.authorities.get(eid))
            .filter((a) => !!a);
    }
}
//# sourceMappingURL=AuthorityRegistry.js.map