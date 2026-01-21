import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  KitRegistry,
  KitMetadata,
  getGlobalKitRegistry,
  resetGlobalKitRegistry,
} from '../src/core/kits/KitRegistry';
import { BaseKit, KitIntakeData } from '../src/core/kits/BaseKit';
import { ActionPlan } from '../src/core/actionPlan/ActionPlanGenerator';
import { MatterClassification } from '../src/core/models';

// Mock kit for testing
class MockKit extends BaseKit {
  protected async processIntake(data: KitIntakeData): Promise<void> {}
  protected async performAnalysis(): Promise<any> {
    return {};
  }
  protected async generateDocuments(): Promise<any[]> {
    return [];
  }
  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    return {
      actionPlan: {
        acknowledgment: '',
        immediateActions: [],
        roleExplanation: { youAre: [], youAreNot: [] },
        settlementPathways: [],
        whatToAvoid: [],
        nextStepOffers: [],
      },
      guidance: '',
    };
  }
  protected async finalizeResults() {
    return {
      kitId: this.kitId,
      sessionId: this.state.sessionId,
      classification: {
        domain: 'test',
        jurisdiction: 'Ontario',
        pillar: 'test',
        confidence: 1,
        matchedHeuristics: [],
      } as MatterClassification,
      actionPlan: this.state.actionPlan!,
      documents: [],
      guidance: '',
      nextSteps: [],
      estimatedTimeToComplete: 10,
    };
  }
  protected validateIntakeData(data: KitIntakeData): void {}
}

describe('KitRegistry', () => {
  let registry: KitRegistry;

  beforeEach(() => {
    registry = new KitRegistry();
  });

  describe('Kit Registration', () => {
    it('should register a kit', () => {
      const metadata: KitMetadata = {
        kitId: 'rent-increase-kit',
        kitName: 'Rent Increase Kit',
        kitDescription: 'Guidance for tenant rent increase disputes',
        domains: ['landlordTenant'],
        estimatedDuration: 30,
        complexity: 'moderate',
        tags: ['tenant', 'rent', 'urgency'],
        factory: () => new MockKit('rent-increase-kit', 'Rent Increase', 'Test'),
        isActive: true,
      };

      registry.registerKit(metadata);
      const retrieved = registry.getKit('rent-increase-kit');

      expect(retrieved).toBeDefined();
      expect(retrieved?.kitName).toBe('Rent Increase Kit');
    });

    it('should prevent duplicate kit registration', () => {
      const metadata: KitMetadata = {
        kitId: 'kit-1',
        kitName: 'Kit 1',
        kitDescription: 'Test',
        domains: ['test'],
        estimatedDuration: 10,
        complexity: 'simple',
        tags: [],
        factory: () => new MockKit('kit-1', 'Kit 1', 'Test'),
        isActive: true,
      };

      registry.registerKit(metadata);
      expect(() => registry.registerKit(metadata)).toThrow(
        'Kit with ID kit-1 already registered'
      );
    });

    it('should register multiple kits', () => {
      const kits: KitMetadata[] = [
        {
          kitId: 'kit-1',
          kitName: 'Kit 1',
          kitDescription: 'Test',
          domains: ['domain1'],
          estimatedDuration: 10,
          complexity: 'simple',
          tags: [],
          factory: () => new MockKit('kit-1', 'Kit 1', 'Test'),
          isActive: true,
        },
        {
          kitId: 'kit-2',
          kitName: 'Kit 2',
          kitDescription: 'Test',
          domains: ['domain2'],
          estimatedDuration: 20,
          complexity: 'moderate',
          tags: [],
          factory: () => new MockKit('kit-2', 'Kit 2', 'Test'),
          isActive: true,
        },
      ];

      registry.registerKits(kits);
      expect(registry.getKitCount()).toBe(2);
    });
  });

  describe('Kit Discovery', () => {
    beforeEach(() => {
      const kits: KitMetadata[] = [
        {
          kitId: 'rent-kit',
          kitName: 'Rent Increase Kit',
          kitDescription: 'Test',
          domains: ['landlordTenant'],
          estimatedDuration: 30,
          complexity: 'moderate',
          tags: ['tenant', 'urgent'],
          factory: () => new MockKit('rent-kit', 'Rent Kit', 'Test'),
          isActive: true,
        },
        {
          kitId: 'employment-kit',
          kitName: 'Employment Termination Kit',
          kitDescription: 'Test',
          domains: ['employment'],
          estimatedDuration: 45,
          complexity: 'complex',
          tags: ['employment', 'termination'],
          factory: () => new MockKit('employment-kit', 'Employment Kit', 'Test'),
          isActive: true,
        },
        {
          kitId: 'claims-kit',
          kitName: 'Small Claims Kit',
          kitDescription: 'Test',
          domains: ['civil-negligence', 'contractualDispute'],
          estimatedDuration: 60,
          complexity: 'complex',
          tags: ['claims', 'urgent', 'civil'],
          factory: () => new MockKit('claims-kit', 'Claims Kit', 'Test'),
          isActive: true,
        },
      ];
      registry.registerKits(kits);
    });

    it('should find kits by domain', () => {
      const kits = registry.findKitsByDomain('landlordTenant');
      expect(kits).toHaveLength(1);
      expect(kits[0].kitId).toBe('rent-kit');
    });

    it('should find multiple kits for a domain', () => {
      const kits = registry.findKitsByDomain('civil-negligence');
      expect(kits).toHaveLength(1);
      expect(kits[0].kitId).toBe('claims-kit');
    });

    it('should find kits by tag', () => {
      const kits = registry.findKitsByTag('urgent');
      expect(kits).toHaveLength(2);
      expect(kits.map(k => k.kitId)).toContain('rent-kit');
      expect(kits.map(k => k.kitId)).toContain('claims-kit');
    });

    it('should search kits by multiple criteria', () => {
      const kits = registry.searchKits({
        tags: ['urgent'],
        maxDuration: 60,
      });

      expect(kits.length).toBeGreaterThan(0);
      expect(kits.some(k => k.kitId === 'rent-kit')).toBe(true);
    });

    it('should search kits by complexity', () => {
      const complexKits = registry.searchKits({ complexity: 'complex' });
      expect(complexKits).toHaveLength(2);
    });

    it('should search kits by domains', () => {
      const kits = registry.searchKits({
        domains: ['employment', 'landlordTenant'],
      });

      expect(kits).toHaveLength(2);
      expect(kits.map(k => k.kitId)).toContain('rent-kit');
      expect(kits.map(k => k.kitId)).toContain('employment-kit');
    });
  });

  describe('Kit Instantiation', () => {
    beforeEach(() => {
      const metadata: KitMetadata = {
        kitId: 'test-kit',
        kitName: 'Test Kit',
        kitDescription: 'Test',
        domains: ['test'],
        estimatedDuration: 10,
        complexity: 'simple',
        tags: [],
        factory: () => new MockKit('test-kit', 'Test Kit', 'Test'),
        isActive: true,
      };
      registry.registerKit(metadata);
    });

    it('should create kit instance', () => {
      const kit = registry.createKit('test-kit', 'session-123', 'user-123');
      expect(kit).toBeDefined();
      expect(kit?.getMetadata().kitId).toBe('test-kit');
    });

    it('should return undefined for nonexistent kit', () => {
      const kit = registry.createKit('nonexistent-kit');
      expect(kit).toBeUndefined();
    });

    it('should throw error when creating inactive kit', () => {
      registry.setKitActive('test-kit', false);
      expect(() => registry.createKit('test-kit')).toThrow('not active');
    });
  });

  describe('Kit Management', () => {
    beforeEach(() => {
      const kits: KitMetadata[] = [
        {
          kitId: 'kit-1',
          kitName: 'Kit 1',
          kitDescription: 'Test',
          domains: ['domain1'],
          estimatedDuration: 10,
          complexity: 'simple',
          tags: [],
          factory: () => new MockKit('kit-1', 'Kit 1', 'Test'),
          isActive: true,
        },
        {
          kitId: 'kit-2',
          kitName: 'Kit 2',
          kitDescription: 'Test',
          domains: ['domain2'],
          estimatedDuration: 20,
          complexity: 'moderate',
          tags: [],
          factory: () => new MockKit('kit-2', 'Kit 2', 'Test'),
          isActive: true,
        },
      ];
      registry.registerKits(kits);
    });

    it('should get all active kits', () => {
      const kits = registry.getAllKits();
      expect(kits).toHaveLength(2);
    });

    it('should enable/disable kits', () => {
      registry.setKitActive('kit-1', false);
      const activekits = registry.getAllKits();
      expect(activekits).toHaveLength(1);
      expect(activekits[0].kitId).toBe('kit-2');
    });

    it('should unregister a kit', () => {
      registry.unregisterKit('kit-1');
      expect(registry.getKit('kit-1')).toBeUndefined();
    });

    it('should get kit count', () => {
      expect(registry.getKitCount()).toBe(2);
      expect(registry.getActiveKitCount()).toBe(2);
    });

    it('should get covered domains', () => {
      const domains = registry.getCoveredDomains();
      expect(domains).toContain('domain1');
      expect(domains).toContain('domain2');
    });
  });

  describe('Summary Generation', () => {
    beforeEach(() => {
      const kits: KitMetadata[] = [
        {
          kitId: 'kit-1',
          kitName: 'Kit 1',
          kitDescription: 'Description 1',
          domains: ['domain1'],
          estimatedDuration: 10,
          complexity: 'simple',
          tags: [],
          factory: () => new MockKit('kit-1', 'Kit 1', 'Test'),
          isActive: true,
        },
        {
          kitId: 'kit-2',
          kitName: 'Kit 2',
          kitDescription: 'Description 2',
          domains: ['domain2'],
          estimatedDuration: 20,
          complexity: 'moderate',
          tags: [],
          factory: () => new MockKit('kit-2', 'Kit 2', 'Test'),
          isActive: false,
        },
      ];
      registry.registerKits(kits);
    });

    it('should generate summary', () => {
      const summary = registry.getSummary();

      expect(summary.totalKits).toBe(2);
      expect(summary.activeKits).toBe(1);
      expect(summary.inactiveKits).toBe(1);
      expect(summary.kits).toHaveLength(1);
      expect(summary.kits[0].kitId).toBe('kit-1');
    });
  });

  describe('Global Registry', () => {
    afterEach(() => {
      resetGlobalKitRegistry();
    });

    it('should return singleton instance', () => {
      const registry1 = getGlobalKitRegistry();
      const registry2 = getGlobalKitRegistry();

      expect(registry1).toBe(registry2);
    });

    it('should reset global registry', () => {
      const registry1 = getGlobalKitRegistry();
      const metadata: KitMetadata = {
        kitId: 'kit-1',
        kitName: 'Kit 1',
        kitDescription: 'Test',
        domains: ['test'],
        estimatedDuration: 10,
        complexity: 'simple',
        tags: [],
        factory: () => new MockKit('kit-1', 'Kit 1', 'Test'),
        isActive: true,
      };
      registry1.registerKit(metadata);

      resetGlobalKitRegistry();
      const registry2 = getGlobalKitRegistry();

      expect(registry2).not.toBe(registry1);
      expect(registry2.getKitCount()).toBe(0);
    });
  });
});
