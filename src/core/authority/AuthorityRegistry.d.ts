import { Authority } from '../models';
export declare class AuthorityRegistry {
    private authorities;
    add(authority: Authority): void;
    update(authority: Authority): void;
    getById(id: string): Authority | undefined;
    list(): Authority[];
    needsUpdate(id: string, now?: Date): boolean;
    getEscalationRoute(id: string): Authority[];
}
//# sourceMappingURL=AuthorityRegistry.d.ts.map