import { describe, expect, it, vi } from 'vitest';
import { WorkflowEngine } from '../src/core/workflow/WorkflowEngine';

describe('WorkflowEngine', () => {
  it('returns the Ontario civil workflow definition', () => {
    const engine = new WorkflowEngine();
    const definitions = engine.getDefinitions();

    expect(definitions).toHaveLength(1);
    expect(definitions[0].id).toBe('ontario-civil-self-rep');
    expect(definitions[0].phases.length).toBeGreaterThan(3);
  });

  it('starts a workflow and selects small claims for lower-value matters', () => {
    const engine = new WorkflowEngine();
    const result = engine.getWorkflow({
      matterId: 'matter-1',
      description: 'A contractor failed to complete work worth $20,000.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 20000,
    });

    expect(result.run.track).toBe('ontario-small-claims');
    expect(result.run.currentPhaseId).toBe('phase-7');
    expect(result.run.stepStates.some((state) => state.stepId === 'limitation-period-verification')).toBe(true);
  });

  it('generates an artifact and marks the step complete', async () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-2',
      description: 'A city-owned tree damaged my parked car.',
      province: 'Ontario',
      domain: 'municipalPropertyDamage',
      disputeAmount: 15000,
      evidence: [{ filename: 'photo.jpg' }],
    });

    const result = await engine.generateArtifact({
      matterId: 'matter-2',
      description: 'A city-owned tree damaged my parked car.',
      province: 'Ontario',
      domain: 'municipalPropertyDamage',
      disputeAmount: 15000,
      evidence: [{ filename: 'photo.jpg' }],
    }, workflow.run, 'limitation-period-verification');

    expect(result.artifact.artifactType).toBe('limitation-memo');
    expect(result.run.artifacts).toHaveLength(1);
    expect(result.run.stepStates.find((state) => state.stepId === 'limitation-period-verification')?.status).toBe('completed');
  });

  it('uses an injected LLM client for research when available', async () => {
    const llmClient = {
      enabled: true,
      generateResearchNarrative: vi.fn(async () => ({
        content: 'LLM-generated workflow narrative.',
        model: 'litellm-smart',
      })),
    };
    const engine = new WorkflowEngine(llmClient);

    const result = await engine.research({
      matter: {
        matterId: 'matter-llm',
        description: 'A city-owned tree damaged my parked car.',
        province: 'Ontario',
        domain: 'municipalPropertyDamage',
        disputeAmount: 15000,
      },
      query: 'limitation-period-verification A city-owned tree damaged my parked car.',
    });

    expect(result.source).toBe('llm');
    expect(result.model).toBe('litellm-smart');
    expect(result.narrative).toBe('LLM-generated workflow narrative.');
    expect(llmClient.generateResearchNarrative).toHaveBeenCalledOnce();
  });

  it('assesses a gate and records the outcome', () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-3',
      description: 'The case may belong in another forum.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 75000,
    });

    const result = engine.assessGate({
      matterId: 'matter-3',
      description: 'The case may belong in another forum.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 75000,
    }, workflow.run, 'gate-1', {
      q1: 'wrong jurisdiction',
      q2: 'pause for ADR review',
    });

    expect(result.result.outcome).toBe('stop');
    expect(result.run.status).toBe('blocked');
    expect(result.run.gateResults).toHaveLength(1);
  });

  it('defines explicit phase 9.5 and 12.5 sections', () => {
    const engine = new WorkflowEngine();
    const definitions = engine.getDefinitions();
    const phaseIds = definitions[0].phases.map((phase) => phase.id);

    expect(phaseIds).toContain('phase-8-5');
    expect(phaseIds).toContain('phase-9-5');
    expect(phaseIds).toContain('phase-12-5');
  });

  it('generates phase 8.5 discovery-specific artifact content', async () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-4',
      description: 'Commercial dispute with contested disclosure volume.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 90000,
      evidence: [{ filename: 'ledger.pdf' }, { filename: 'emails.msg' }],
      documents: [{ packageId: 'pkg-1' }],
    });

    const result = await engine.generateArtifact({
      matterId: 'matter-4',
      description: 'Commercial dispute with contested disclosure volume.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 90000,
      evidence: [{ filename: 'ledger.pdf' }, { filename: 'emails.msg' }],
      documents: [{ packageId: 'pkg-1' }],
    }, workflow.run, 'affidavit-of-documents');

    expect(result.artifact.artifactType).toBe('affidavit-of-documents');
    expect(result.artifact.content).toContain('Phase 8.5 Affidavit of Documents Structure');
    expect(result.artifact.content).toContain('Schedule A');
    expect(result.artifact.content).toContain('Schedule B');
    expect(result.artifact.content).toContain('Schedule C');
  });

  it('generates phase 9.5 settlement economics content for Rule 49', async () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-5',
      description: 'Civil claim with material settlement risk and trial cost exposure.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 120000,
    });

    const result = await engine.generateArtifact({
      matterId: 'matter-5',
      description: 'Civil claim with material settlement risk and trial cost exposure.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 120000,
    }, workflow.run, 'rule-49-offer-strategy');

    expect(result.artifact.content).toContain('Phase 9.5 Rule 49 Economics Snapshot');
    expect(result.artifact.content).toContain('Working settlement range');
    expect(result.artifact.content).toContain('Provisional adverse-cost reserve');
  });

  it('generates phase 12.5 appeal viability content', async () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-6',
      description: 'Judgment entered with disputed legal findings and potential stay request.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 85000,
    });

    const result = await engine.generateArtifact({
      matterId: 'matter-6',
      description: 'Judgment entered with disputed legal findings and potential stay request.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 85000,
    }, workflow.run, 'appeal-and-stay-workflow');

    expect(result.artifact.content).toContain('Phase 12.5 Appeal Viability Matrix');
    expect(result.artifact.content).toContain('appeal/stay filing deadlines');
  });

  it('pauses gate 4 when rule 49 and pre-trial baseline is incomplete', () => {
    const engine = new WorkflowEngine();
    const workflow = engine.getWorkflow({
      matterId: 'matter-7',
      description: 'Civil claim moving toward trial scheduling.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 95000,
    });

    const result = engine.assessGate({
      matterId: 'matter-7',
      description: 'Civil claim moving toward trial scheduling.',
      province: 'Ontario',
      domain: 'civil-negligence',
      disputeAmount: 95000,
    }, workflow.run, 'gate-4', {
      q1: 'we can proceed',
      q2: 'ready',
    });

    expect(result.result.outcome).toBe('pause');
    expect(result.run.status).toBe('paused');
  });

  describe('buildGateScorecard', () => {
    it('returns a full scorecard for gate-3 when all discovery steps are complete', () => {
      const engine = new WorkflowEngine();
      const completedSteps = new Set(['affidavit-of-documents', 'document-production', 'production-review-matrix', 'undertakings-tracker', 'proportionality-memo']);
      const scorecard = (engine as any).buildGateScorecard('gate-3', completedSteps);

      expect(scorecard).toBeDefined();
      expect(scorecard.overall).toBe(100);
      expect(scorecard.items).toHaveLength(5);
      expect(scorecard.summary).toContain('Discovery');
    });

    it('returns a full scorecard for gate-4 when all settlement steps are complete', () => {
      const engine = new WorkflowEngine();
      const completedSteps = new Set(['rule-49-offer-strategy', 'mandatory-mediation-preparation', 'pre-trial-conference-preparation', 'pre-trial-brief']);
      const scorecard = (engine as any).buildGateScorecard('gate-4', completedSteps);

      expect(scorecard).toBeDefined();
      expect(scorecard.overall).toBe(100);
      expect(scorecard.items).toHaveLength(4);
      expect(scorecard.summary).toContain('Settlement');
    });

    it('returns a full scorecard for gate-5 when all appeal steps are complete', () => {
      const engine = new WorkflowEngine();
      const completedSteps = new Set(['judgment-analysis', 'appeal-and-stay-workflow', 'appellate-record-checklist', 'costs-submissions']);
      const scorecard = (engine as any).buildGateScorecard('gate-5', completedSteps);

      expect(scorecard).toBeDefined();
      expect(scorecard.overall).toBe(100);
      expect(scorecard.items).toHaveLength(4);
      expect(scorecard.summary).toContain('Appeal');
    });

    it('returns undefined for an unrecognised gate id', () => {
      const engine = new WorkflowEngine();
      const scorecard = (engine as any).buildGateScorecard('gate-1', new Set());

      expect(scorecard).toBeUndefined();
    });
  });
});

