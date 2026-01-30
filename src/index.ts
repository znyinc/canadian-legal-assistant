export * from './core/models';
export { ActionPlanGenerator } from './core/actionPlan/ActionPlanGenerator';
export type { ActionPlan, ActionStep, RoleExplanation, SettlementPathway, WhatToAvoid, NextStepOffer } from './core/actionPlan/ActionPlanGenerator';

// Agents and kits temporarily disabled - pending full Task 26.6 integration
// See tasks.md Task 26.6 for implementation plan
// TODO: Integrate after fixing interface alignment (agents use outdated model types)
// export { IntakeAgent, AnalysisAgent, DocumentAgent, GuidanceAgent } from './core/agents';
// export { BaseKit, KitOrchestrator, KitRegistry } from './core/kits';
