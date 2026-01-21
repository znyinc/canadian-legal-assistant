import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseKit, KitExecutionState, KitResult, KitIntakeData } from '../src/core/kits/BaseKit';
import { ActionPlan } from '../src/core/actionPlan/ActionPlanGenerator';
import { MatterClassification } from '../src/core/models';

// Mock implementation of BaseKit for testing
class TestKit extends BaseKit {
  protected async processIntake(data: KitIntakeData): Promise<void> {
    this.updateUserInputs('processed', true);
  }

  protected async performAnalysis(): Promise<any> {
    return {
      domain: 'civil-negligence',
      analysisComplete: true,
    };
  }

  protected async generateDocuments(): Promise<any[]> {
    return [
      { type: 'demand-letter', title: 'Demand Letter' },
      { type: 'evidence-checklist', title: 'Evidence Checklist' },
    ];
  }

  protected async generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }> {
    const actionPlan: ActionPlan = {
      acknowledgment: 'You have a strong case',
      immediateActions: [
        { priority: 'urgent', description: 'Gather evidence', daysToComplete: 7 },
      ],
      roleExplanation: { youAre: ['Plaintiff'], youAreNot: ['Judge'] },
      settlementPathways: [
        { name: 'Direct negotiation', typical: true, pros: ['Fast'], cons: ['May not maximize'] },
      ],
      whatToAvoid: [
        { severity: 'critical', warning: 'Do not contact defendant directly' },
      ],
      nextStepOffers: [
        { action: 'Generate demand letter', documentType: 'demand-letter' },
      ],
    };

    return {
      actionPlan,
      guidance: 'Start by gathering evidence within the next week.',
    };
  }

  protected async finalizeResults(): Promise<KitResult> {
    const classification: MatterClassification = {
      domain: 'civil-negligence',
      jurisdiction: 'Ontario',
      pillar: 'civil',
      confidence: 0.95,
      matchedHeuristics: [],
    };

    return {
      kitId: this.kitId,
      sessionId: this.state.sessionId,
      classification,
      actionPlan: this.state.actionPlan!,
      documents: this.state.documents || [],
      guidance: this.state.guidance || '',
      nextSteps: ['Review documents', 'Gather evidence', 'Send demand letter'],
      estimatedTimeToComplete: 14,
    };
  }

  protected validateIntakeData(data: KitIntakeData): void {
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }
  }
}

describe('BaseKit Architecture', () => {
  let kit: TestKit;
  let sessionId: string;
  const userId = 'user-123';

  beforeEach(() => {
    sessionId = 'session-123';
    kit = new TestKit('test-kit', 'Test Kit', 'A test kit for unit testing', sessionId, userId);
  });

  describe('Kit Initialization', () => {
    it('should create a kit with correct metadata', () => {
      const metadata = kit.getMetadata();
      expect(metadata.kitId).toBe('test-kit');
      expect(metadata.kitName).toBe('Test Kit');
      expect(metadata.kitDescription).toBe('A test kit for unit testing');
      expect(metadata.sessionId).toBe(sessionId);
    });

    it('should initialize with intake stage', () => {
      const state = kit.getState();
      expect(state.currentStage).toBe('intake');
      expect(state.completedStages).length === 0;
      expect(state.progress).toBe(0);
    });

    it('should generate session ID if not provided', () => {
      const testKit2 = new TestKit('kit-2', 'Kit 2', 'Another kit');
      const metadata = testKit2.getMetadata();
      expect(metadata.sessionId).toMatch(/^kit-kit-2-/);
    });
  });

  describe('Intake Stage', () => {
    it('should process intake data successfully', async () => {
      const data: KitIntakeData = {
        description: 'Tree fell on my property causing damage',
        jurisdiction: 'Ontario',
        tags: ['property-damage', 'urgent'],
      };

      const state = await kit.intake(data);

      expect(state.currentStage).toBe('analysis');
      expect(state.completedStages).toContain('intake');
      expect(state.progress).toBe(20);
      expect(state.userInputs.description).toBe(data.description);
      expect(state.userInputs.jurisdiction).toBe(data.jurisdiction);
      expect(state.userInputs.tags).toEqual(data.tags);
    });

    it('should validate intake data', async () => {
      const data: KitIntakeData = {
        description: '', // empty description
      };

      await expect(kit.intake(data)).rejects.toThrow('Description is required');
    });

    it('should merge custom fields into user inputs', async () => {
      const data: KitIntakeData = {
        description: 'My case details',
        customFields: {
          claimAmount: 50000,
          damageType: 'property',
        },
      };

      const state = await kit.intake(data);

      expect(state.userInputs.claimAmount).toBe(50000);
      expect(state.userInputs.damageType).toBe('property');
    });
  });

  describe('Analysis Stage', () => {
    it('should perform analysis after intake', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);

      const state = await kit.analysis();

      expect(state.currentStage).toBe('document');
      expect(state.completedStages).toContain('analysis');
      expect(state.progress).toBe(40);
      expect(state.analysisResult).toBeDefined();
      expect(state.analysisResult.domain).toBe('civil-negligence');
    });

    it('should fail if called before intake', async () => {
      await expect(kit.analysis()).rejects.toThrow(
        'Cannot transition from intake to document'
      );
    });
  });

  describe('Document Stage', () => {
    it('should generate documents after analysis', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);
      await kit.analysis();

      const state = await kit.document();

      expect(state.currentStage).toBe('guidance');
      expect(state.completedStages).toContain('document');
      expect(state.progress).toBe(60);
      expect(state.documents).toBeDefined();
      expect(state.documents!.length).toBe(2);
      expect(state.documents![0].type).toBe('demand-letter');
    });
  });

  describe('Guidance Stage', () => {
    it('should generate guidance after document stage', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);
      await kit.analysis();
      await kit.document();

      const state = await kit.guidance();

      expect(state.currentStage).toBe('complete');
      expect(state.completedStages).toContain('guidance');
      expect(state.progress).toBe(80);
      expect(state.actionPlan).toBeDefined();
      expect(state.guidance).toBeDefined();
    });
  });

  describe('Complete Stage', () => {
    it('should finalize results and return KitResult', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);
      await kit.analysis();
      await kit.document();
      await kit.guidance();

      const result = await kit.complete();

      expect(result.kitId).toBe('test-kit');
      expect(result.classification).toBeDefined();
      expect(result.actionPlan).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.guidance).toBeDefined();
      expect(result.nextSteps).toContain('Review documents');
      expect(result.estimatedTimeToComplete).toBe(14);
    });
  });

  describe('Full Workflow Execution', () => {
    it('should execute complete workflow sequentially', async () => {
      const data: KitIntakeData = {
        description: 'Tree damage on my property',
        jurisdiction: 'Ontario',
      };

      const result = await kit.executeFullWorkflow(data);

      expect(result.kitId).toBe('test-kit');
      expect(result.classification).toBeDefined();
      expect(result.actionPlan).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.guidance).toBeDefined();

      const finalState = kit.getState();
      expect(finalState.progress).toBe(100);
      expect(finalState.currentStage).toBe('complete');
    });

    it('should progress through all stages correctly', async () => {
      const data: KitIntakeData = { description: 'My case' };
      const result = await kit.executeFullWorkflow(data);

      const state = kit.getState();
      expect(state.completedStages).toEqual(['intake', 'analysis', 'document', 'guidance']);
    });
  });

  describe('State Management', () => {
    it('should update user inputs', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);

      const kit2 = kit as any;
      kit2.updateUserInputs('claimAmount', 100000);

      const state = kit.getState();
      expect(state.userInputs.claimAmount).toBe(100000);
    });

    it('should update system context', async () => {
      const data: KitIntakeData = { description: 'My case' };
      await kit.intake(data);

      const kit2 = kit as any;
      kit2.updateSystemContext('forumId', 'ON-SC');

      const state = kit.getState();
      expect(state.systemContext.forumId).toBe('ON-SC');
    });

    it('should track modification timestamps', async () => {
      const data: KitIntakeData = { description: 'My case' };
      const initialState = kit.getState();
      const initialTime = initialState.lastModified;

      // Small delay to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      await kit.intake(data);

      const updatedState = kit.getState();
      expect(updatedState.lastModified.getTime()).toBeGreaterThan(
        initialTime.getTime()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle intake errors gracefully', async () => {
      const data: KitIntakeData = { description: '' };
      await expect(kit.intake(data)).rejects.toThrow('Intake stage failed');
    });

    it('should maintain state on error', async () => {
      const data: KitIntakeData = { description: '' };
      try {
        await kit.intake(data);
      } catch (error) {
        // Expected
      }

      const state = kit.getState();
      expect(state.currentStage).toBe('intake');
      expect(state.progress).toBe(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress through stages', async () => {
      const data: KitIntakeData = { description: 'My case' };

      let state = kit.getState();
      expect(state.progress).toBe(0);

      await kit.intake(data);
      state = kit.getState();
      expect(state.progress).toBe(20);

      await kit.analysis();
      state = kit.getState();
      expect(state.progress).toBe(40);

      await kit.document();
      state = kit.getState();
      expect(state.progress).toBe(60);

      await kit.guidance();
      state = kit.getState();
      expect(state.progress).toBe(80);

      await kit.complete();
      state = kit.getState();
      expect(state.progress).toBe(100);
    });
  });
});
