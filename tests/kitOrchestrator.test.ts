import { describe, it, expect, beforeEach } from 'vitest';
import { KitOrchestrator, KitExecutionEvent } from '../src/core/kits/KitOrchestrator';
import { BaseKit, KitIntakeData } from '../src/core/kits/BaseKit';
import { ActionPlan } from '../src/core/actionPlan/ActionPlanGenerator';
import { MatterClassification } from '../src/core/models';

// Mock test kit
class MockKit extends BaseKit {
  protected async processIntake(data: KitIntakeData): Promise<void> {
    this.updateUserInputs('description', data.description);
  }

  protected async performAnalysis(): Promise<any> {
    return { domain: 'civil-negligence', analyzed: true };
  }

  protected async generateDocuments(): Promise<any[]> {
    return [{ type: 'demand-letter', title: 'Demand' }];
  }

  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    return {
      actionPlan: {
        acknowledgment: 'Test guidance',
        immediateActions: [],
        roleExplanation: { youAre: [], youAreNot: [] },
        settlementPathways: [],
        whatToAvoid: [],
        nextStepOffers: [],
      },
      guidance: 'Test guidance text',
    };
  }

  protected async finalizeResults() {
    return {
      kitId: this.kitId,
      sessionId: this.state.sessionId,
      classification: {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
        pillar: 'civil',
        confidence: 0.95,
        matchedHeuristics: [],
      } as MatterClassification,
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: ['Step 1', 'Step 2'],
      estimatedTimeToComplete: 10,
    };
  }

  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description) throw new Error('Description required');
  }
}

describe('KitOrchestrator', () => {
  let orchestrator: KitOrchestrator;
  const sessionId = 'session-123';
  const userId = 'user-123';

  beforeEach(() => {
    orchestrator = new KitOrchestrator();
  });

  describe('Context Management', () => {
    it('should create a new execution context', () => {
      const context = orchestrator.createContext(sessionId, userId);

      expect(context.sessionId).toBe(sessionId);
      expect(context.userId).toBe(userId);
      expect(context.activeKits.size).toBe(0);
      expect(context.executionLog).toEqual([]);
    });

    it('should retrieve existing context', () => {
      const context1 = orchestrator.createContext(sessionId, userId);
      const context2 = orchestrator.getOrCreateContext(sessionId);

      expect(context2.sessionId).toBe(context1.sessionId);
      expect(context2).toBe(context1);
    });

    it('should create context if not exists', () => {
      const context = orchestrator.getOrCreateContext('new-session-456');

      expect(context.sessionId).toBe('new-session-456');
      expect(context.activeKits.size).toBe(0);
    });

    it('should cleanup context', () => {
      orchestrator.createContext(sessionId);
      expect(orchestrator.getActiveSessions()).toContain(sessionId);

      orchestrator.cleanupContext(sessionId);
      expect(orchestrator.getActiveSessions()).not.toContain(sessionId);
    });
  });

  describe('Kit Registration', () => {
    it('should register a kit instance', () => {
      const kit = new MockKit('kit-1', 'Mock Kit 1', 'Test', sessionId);
      orchestrator.registerKit(sessionId, kit);

      const context = orchestrator.getContext(sessionId);
      expect(context?.activeKits.size).toBe(1);
      expect(context?.activeKits.has('kit-1')).toBe(true);
    });

    it('should register multiple kits', () => {
      const kit1 = new MockKit('kit-1', 'Mock Kit 1', 'Test', sessionId);
      const kit2 = new MockKit('kit-2', 'Mock Kit 2', 'Test', sessionId);

      orchestrator.registerKit(sessionId, kit1);
      orchestrator.registerKit(sessionId, kit2);

      const context = orchestrator.getContext(sessionId);
      expect(context?.activeKits.size).toBe(2);
    });
  });

  describe('Kit Execution', () => {
    it('should execute a complete kit workflow', async () => {
      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      const intakeData: KitIntakeData = { description: 'My legal issue' };

      const result = await orchestrator.executeKit(sessionId, kit, intakeData);

      expect(result.kitId).toBe('kit-1');
      expect(result.classification).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.guidance).toBeDefined();
    });

    it('should track execution with events', async () => {
      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      const intakeData: KitIntakeData = { description: 'My issue' };

      await orchestrator.executeKit(sessionId, kit, intakeData);

      const log = orchestrator.getExecutionLog(sessionId);
      expect(log.length).toBeGreaterThan(0);
      expect(log.some(e => e.type === 'started')).toBe(true);
      expect(log.some(e => e.type === 'completed')).toBe(true);
    });

    it('should execute kit with stage tracking callback', async () => {
      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      const intakeData: KitIntakeData = { description: 'My issue' };
      const stagesCompleted: string[] = [];

      await orchestrator.executeKitWithTracking(
        sessionId,
        kit,
        intakeData,
        (stage) => stagesCompleted.push(stage)
      );

      expect(stagesCompleted).toContain('intake');
      expect(stagesCompleted).toContain('analysis');
      expect(stagesCompleted).toContain('document');
      expect(stagesCompleted).toContain('guidance');
    });

    it('should handle kit execution errors', async () => {
      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      const invalidData: KitIntakeData = { description: '' };

      await expect(
        orchestrator.executeKit(sessionId, kit, invalidData)
      ).rejects.toThrow();

      const log = orchestrator.getExecutionLog(sessionId);
      expect(log.some(e => e.type === 'error')).toBe(true);
    });
  });

  describe('Concurrent Kit Execution', () => {
    it('should execute multiple kits concurrently', async () => {
      const kit1 = new MockKit('kit-1', 'Kit 1', 'Test', sessionId);
      const kit2 = new MockKit('kit-2', 'Kit 2', 'Test', sessionId);
      const kit3 = new MockKit('kit-3', 'Kit 3', 'Test', sessionId);

      const results = await orchestrator.executeMultipleKits(sessionId, [
        { kit: kit1, intakeData: { description: 'Issue 1' } },
        { kit: kit2, intakeData: { description: 'Issue 2' } },
        { kit: kit3, intakeData: { description: 'Issue 3' } },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].kitId).toBe('kit-1');
      expect(results[1].kitId).toBe('kit-2');
      expect(results[2].kitId).toBe('kit-3');
    });

    it('should maintain shared state across kits', async () => {
      const kit1 = new MockKit('kit-1', 'Kit 1', 'Test', sessionId);
      const kit2 = new MockKit('kit-2', 'Kit 2', 'Test', sessionId);

      orchestrator.registerKit(sessionId, kit1);
      orchestrator.registerKit(sessionId, kit2);

      orchestrator.shareStateToKit(sessionId, 'kit-1', 'claimAmount', 50000);
      const sharedValue = orchestrator.getSharedState(sessionId, 'claimAmount');

      expect(sharedValue).toBe(50000);
    });

    it('should get all shared state', () => {
      orchestrator.createContext(sessionId);
      orchestrator.shareStateToKit(sessionId, 'kit-1', 'key1', 'value1');
      orchestrator.shareStateToKit(sessionId, 'kit-1', 'key2', 'value2');

      const allState = orchestrator.getSharedState(sessionId);
      expect(allState.key1).toBe('value1');
      expect(allState.key2).toBe('value2');
    });
  });

  describe('Event Logging', () => {
    it('should log execution events', async () => {
      const events: KitExecutionEvent[] = [];
      orchestrator.onExecutionEvent(e => events.push(e));

      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      await orchestrator.executeKit(sessionId, kit, { description: 'Issue' });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('started');
      expect(events[events.length - 1].type).toBe('completed');
    });

    it('should retrieve execution log', async () => {
      const kit = new MockKit('kit-1', 'Mock Kit', 'Test', sessionId);
      await orchestrator.executeKitWithTracking(sessionId, kit, { description: 'Issue' });

      const log = orchestrator.getExecutionLog(sessionId);
      expect(log.length).toBeGreaterThan(0);
      // Should have: started + 4 stages (intake, analysis, document, guidance) + completed
      expect(log.some(e => e.type === 'started')).toBe(true);
      expect(log.some(e => e.type === 'completed')).toBe(true);
      expect(log.some(e => e.type === 'stage-completed')).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should track active sessions', () => {
      orchestrator.createContext('session-1');
      orchestrator.createContext('session-2');
      orchestrator.createContext('session-3');

      const sessions = orchestrator.getActiveSessions();
      expect(sessions).toContain('session-1');
      expect(sessions).toContain('session-2');
      expect(sessions).toContain('session-3');
    });

    it('should cleanup expired sessions', () => {
      // Create orchestrator with 100ms timeout
      const shortTimeoutOrchestrator = new KitOrchestrator(100);

      shortTimeoutOrchestrator.createContext('session-1');
      shortTimeoutOrchestrator.createContext('session-2');

      expect(shortTimeoutOrchestrator.getActiveSessions()).toHaveLength(2);

      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          shortTimeoutOrchestrator.cleanupExpiredSessions();
          expect(shortTimeoutOrchestrator.getActiveSessions()).toHaveLength(0);
          resolve(null);
        }, 150);
      });
    });
  });
});
