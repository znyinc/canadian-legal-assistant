import { Authority } from '../models';

export class AuthorityRegistry {
  private authorities: Map<string, Authority> = new Map();

  add(authority: Authority): void {
    this.authorities.set(authority.id, authority);
  }

  update(authority: Authority): void {
    if (!this.authorities.has(authority.id)) {
      throw new Error(`Authority ${authority.id} not found`);
    }
    this.authorities.set(authority.id, authority);
  }

  getById(id: string): Authority | undefined {
    return this.authorities.get(id);
  }

  list(): Authority[] {
    return Array.from(this.authorities.values());
  }

  needsUpdate(id: string, now: Date = new Date()): boolean {
    const auth = this.authorities.get(id);
    if (!auth) return false;
    const last = new Date(auth.updatedAt).getTime();
    const nextDue = last + auth.updateCadenceDays * 24 * 60 * 60 * 1000;
    return now.getTime() >= nextDue;
  }

  getEscalationRoute(id: string): Authority[] {
    const auth = this.authorities.get(id);
    if (!auth) return [];
    return auth.escalationRoutes
      .map((eid) => this.authorities.get(eid))
      .filter((a): a is Authority => !!a);
  }
}
