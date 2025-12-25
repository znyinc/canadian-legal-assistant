import { describe, it, expect } from 'vitest';
import { DomainModuleRegistry } from '../src/core/domains/DomainModuleRegistry';
import { InsuranceDomainModule } from '../src/core/domains/InsuranceDomainModule';
import { LandlordTenantDomainModule } from '../src/core/domains/LandlordTenantDomainModule';

describe('DomainModuleRegistry', () => {
  it('registers and retrieves modules', () => {
    const registry = new DomainModuleRegistry();
    const insurance = new InsuranceDomainModule();
    const lt = new LandlordTenantDomainModule();

    registry.register(insurance);
    registry.register(lt);

    expect(registry.get('insurance')).toBe(insurance);
    expect(registry.get('landlordTenant')).toBe(lt);
    expect(registry.list().length).toBe(2);
  });
});
