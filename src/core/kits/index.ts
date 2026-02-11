/**
 * High-Impact Decision-Support Kits (Task 26.3)
 * 
 * 5 specialized kits that orchestrate the 4-agent framework for specific legal scenarios:
 * - RentIncreaseKit: LTB T1 application guidance
 * - EmploymentTerminationKit: ESA vs wrongful dismissal analysis
 * - SmallClaimsPreparationKit: Form 7A filing preparation
 * - MotorVehicleAccidentKit: DC-PD vs tort claim analysis
 * - WillChallengeKit: Will contest grounds assessment
 */

// Classes and runtime values
export { BaseKit } from './BaseKit';
export { KitOrchestrator } from './KitOrchestrator';
export { KitRegistry, getGlobalKitRegistry, resetGlobalKitRegistry } from './KitRegistry';

// Type-only exports (interfaces)
export type { KitStage, KitExecutionState, KitResult, KitIntakeData } from './BaseKit';
export type { KitExecutionEvent, KitExecutionContext } from './KitOrchestrator';
export type { KitMetadata, KitFactory } from './KitRegistry';

// High-Impact Decision-Support Kits (Task 26.3)
export { RentIncreaseKit } from './RentIncreaseKit';
export { EmploymentTerminationKit } from './EmploymentTerminationKit';
export { SmallClaimsPreparationKit } from './SmallClaimsPreparationKit';
export { MotorVehicleAccidentKit } from './MotorVehicleAccidentKit';
export { WillChallengeKit } from './WillChallengeKit';
