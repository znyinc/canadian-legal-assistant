import { MatterClassification } from '../models';
import { ActionPlan } from '../actionPlan/ActionPlanGenerator';

/**
 * Kit Lifecycle Stages
 * Represents the progression of a user through a decision-support kit
 */
export type KitStage = 'intake' | 'analysis' | 'document' | 'guidance' | 'complete';

/**
 * Kit Execution State - tracks progress, context, and results
 */
export interface KitExecutionState {
  // Session and Identity
  sessionId: string;
  userId?: string;
  kitId: string;
  startedAt: Date;
  lastModified: Date;

  // Lifecycle Tracking
  currentStage: KitStage;
  completedStages: KitStage[];
  progress: number; // 0-100

  // Context Data
  classification?: MatterClassification;
  userInputs: Record<string, any>; // Accumulated user responses
  systemContext: Record<string, any>; // System-generated context
  
  // Extracted Results
  analysisResult?: any;
  documents?: any[];
  actionPlan?: ActionPlan;
  guidance?: string;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Kit Result - returned at completion
 */
export interface KitResult {
  kitId: string;
  sessionId: string;
  classification: MatterClassification;
  actionPlan: ActionPlan;
  documents: any[];
  guidance: string;
  nextSteps: string[];
  estimatedTimeToComplete: number; // minutes
  risks?: string[];
  opportunities?: string[];
}

/**
 * Kit Intake Data - initial user submission
 */
export interface KitIntakeData {
  description: string;
  jurisdiction?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * BaseKit - Abstract base class for all decision-support kits
 * Implements standardized lifecycle and state management
 * 
 * Lifecycle Flow:
 * 1. intake - Collect initial user information
 * 2. analysis - Classify matter and analyze options
 * 3. document - Generate relevant documents and templates
 * 4. guidance - Create action plan and next steps
 * 5. complete - Finalize results and offer follow-up actions
 */
export abstract class BaseKit {
  protected kitId: string;
  protected kitName: string;
  protected kitDescription: string;
  protected state: KitExecutionState;

  constructor(
    kitId: string,
    kitName: string,
    kitDescription: string,
    sessionId?: string,
    userId?: string
  ) {
    this.kitId = kitId;
    this.kitName = kitName;
    this.kitDescription = kitDescription;
    this.state = {
      sessionId: sessionId || this.generateSessionId(),
      userId,
      kitId,
      startedAt: new Date(),
      lastModified: new Date(),
      currentStage: 'intake',
      completedStages: [],
      progress: 0,
      userInputs: {},
      systemContext: {},
    };
  }

  /**
   * Process intake stage - collect and validate initial information
   */
  async intake(data: KitIntakeData): Promise<KitExecutionState> {
    try {
      // Validate input
      this.validateIntakeData(data);

      // Store user inputs
      this.state.userInputs = {
        ...this.state.userInputs,
        description: data.description,
        jurisdiction: data.jurisdiction,
        tags: data.tags,
        ...data.customFields,
      };

      // Run kit-specific intake processing
      await this.processIntake(data);

      // Mark stage as completed
      this.transitionStage('intake', 'analysis');
      this.state.progress = 20;

      return this.state;
    } catch (error) {
      throw new Error(`Intake stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process analysis stage - classify matter and analyze options
   */
  async analysis(): Promise<KitExecutionState> {
    try {
      // Run kit-specific analysis
      const result = await this.performAnalysis();
      this.state.analysisResult = result;

      // Mark stage as completed
      this.transitionStage('analysis', 'document');
      this.state.progress = 40;

      return this.state;
    } catch (error) {
      throw new Error(`Analysis stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process document stage - generate relevant documents and templates
   */
  async document(): Promise<KitExecutionState> {
    try {
      // Run kit-specific document generation
      const documents = await this.generateDocuments();
      this.state.documents = documents;

      // Mark stage as completed
      this.transitionStage('document', 'guidance');
      this.state.progress = 60;

      return this.state;
    } catch (error) {
      throw new Error(`Document stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process guidance stage - create action plan and next steps
   */
  async guidance(): Promise<KitExecutionState> {
    try {
      // Run kit-specific guidance generation
      const result = await this.generateGuidance();
      this.state.actionPlan = result.actionPlan;
      this.state.guidance = result.guidance;

      // Mark stage as completed
      this.transitionStage('guidance', 'complete');
      this.state.progress = 80;

      return this.state;
    } catch (error) {
      throw new Error(`Guidance stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete the kit execution and return final result
   */
  async complete(): Promise<KitResult> {
    try {
      // Validate all stages are complete
      if (this.state.currentStage !== 'complete') {
        throw new Error('Kit is not yet at completion stage');
      }

      // Finalize and package results
      const result = await this.finalizeResults();
      
      this.state.progress = 100;
      this.state.lastModified = new Date();

      return result;
    } catch (error) {
      throw new Error(`Completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute full kit workflow sequentially
   */
  async executeFullWorkflow(data: KitIntakeData): Promise<KitResult> {
    await this.intake(data);
    await this.analysis();
    await this.document();
    await this.guidance();
    return await this.complete();
  }

  /**
   * Get current execution state
   */
  getState(): KitExecutionState {
    return { ...this.state };
  }

  /**
   * Get kit metadata
   */
  getMetadata() {
    return {
      kitId: this.kitId,
      kitName: this.kitName,
      kitDescription: this.kitDescription,
      sessionId: this.state.sessionId,
    };
  }

  // ============================================================================
  // Abstract methods to be implemented by subclasses
  // ============================================================================

  /**
   * Kit-specific intake processing
   */
  protected abstract processIntake(data: KitIntakeData): Promise<void>;

  /**
   * Kit-specific analysis logic
   */
  protected abstract performAnalysis(): Promise<any>;

  /**
   * Kit-specific document generation
   */
  protected abstract generateDocuments(): Promise<any[]>;

  /**
   * Kit-specific guidance generation
   */
  protected abstract generateGuidance(): Promise<{ actionPlan: ActionPlan; guidance: string }>;

  /**
   * Kit-specific result finalization
   */
  protected abstract finalizeResults(): Promise<KitResult>;

  /**
   * Validate kit-specific intake data
   */
  protected abstract validateIntakeData(data: KitIntakeData): void;

  // ============================================================================
  // Protected helper methods
  // ============================================================================

  /**
   * Transition between kit stages
   */
  protected transitionStage(from: KitStage, to: KitStage): void {
    if (this.state.currentStage !== from) {
      throw new Error(`Cannot transition from ${this.state.currentStage} to ${to}: currently in ${this.state.currentStage}`);
    }
    this.state.completedStages.push(from);
    this.state.currentStage = to;
    this.state.lastModified = new Date();
  }

  /**
   * Update user inputs
   */
  protected updateUserInputs(key: string, value: any): void {
    this.state.userInputs[key] = value;
    this.state.lastModified = new Date();
  }

  /**
   * Update system context
   */
  protected updateSystemContext(key: string, value: any): void {
    this.state.systemContext[key] = value;
    this.state.lastModified = new Date();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `kit-${this.kitId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
