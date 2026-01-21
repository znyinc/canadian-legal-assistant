/**
 * Agents - Core agentic AI framework
 * 
 * Exports:
 * - IntakeAgent: Conversational intake with dynamic question generation
 * - AnalysisAgent: Multi-domain classification and evidence synthesis
 * - DocumentAgent: Context-aware template selection and document generation
 * - GuidanceAgent: Personalized action plans and pathway optimization
 */

export { IntakeAgent } from './IntakeAgent';
export type {
  ConversationalQuestion,
  UserResponse,
  EvidenceRequirement,
  IntakeAnalysisResult
} from './IntakeAgent';

export { AnalysisAgent } from './AnalysisAgent';
export type {
  EvidenceSynthesis,
  ClassificationAnalysis,
  DeadlineAnalysis,
  AnalysisResult
} from './AnalysisAgent';

export { DocumentAgent } from './DocumentAgent';
export type {
  DocumentRecommendation,
  TemplateMappingResult,
  DocumentGenerationResult
} from './DocumentAgent';

export { GuidanceAgent } from './GuidanceAgent';
export type {
  GuidanceRecommendation,
  PathwayOptimization,
  GuidanceResult
} from './GuidanceAgent';
