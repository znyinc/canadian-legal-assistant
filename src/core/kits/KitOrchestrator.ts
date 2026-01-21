import { BaseKit, KitExecutionState, KitResult, KitIntakeData } from './BaseKit';

/**
 * Kit Execution Event - for tracking and logging
 */
export interface KitExecutionEvent {
  type: 'started' | 'stage-completed' | 'error' | 'completed';
  kitId: string;
  sessionId: string;
  timestamp: Date;
  stage?: string;
  data?: any;
}

/**
 * Kit Execution Context - shared context across kit operations
 */
export interface KitExecutionContext {
  sessionId: string;
  userId?: string;
  startedAt: Date;
  activeKits: Map<string, BaseKit>;
  sharedState: Record<string, any>;
  executionLog: KitExecutionEvent[];
}

/**
 * KitOrchestrator - Manages kit execution, state transitions, and coordination
 * 
 * Responsibilities:
 * - Kit instantiation and lifecycle management
 * - State persistence and recovery
 * - Cross-kit communication and context sharing
 * - Event logging and audit trail
 * - Concurrent execution coordination
 * - Result aggregation
 */
export class KitOrchestrator {
  private contexts: Map<string, KitExecutionContext> = new Map();
  private eventListeners: ((event: KitExecutionEvent) => void)[] = [];
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes default

  constructor(sessionTimeout?: number) {
    if (sessionTimeout) {
      this.sessionTimeout = sessionTimeout;
    }
  }

  /**
   * Create a new execution context for a session
   */
  createContext(sessionId: string, userId?: string): KitExecutionContext {
    const context: KitExecutionContext = {
      sessionId,
      userId,
      startedAt: new Date(),
      activeKits: new Map(),
      sharedState: {},
      executionLog: [],
    };
    
    this.contexts.set(sessionId, context);
    return context;
  }

  /**
   * Get or create execution context
   */
  getOrCreateContext(sessionId: string, userId?: string): KitExecutionContext {
    let context = this.contexts.get(sessionId);
    if (!context) {
      context = this.createContext(sessionId, userId);
    }
    return context;
  }

  /**
   * Register a kit instance in the context
   */
  registerKit(sessionId: string, kit: BaseKit): void {
    const context = this.getOrCreateContext(sessionId);
    const metadata = kit.getMetadata();
    context.activeKits.set(metadata.kitId, kit);
    
    this.logEvent({
      type: 'started',
      kitId: metadata.kitId,
      sessionId,
      timestamp: new Date(),
    });
  }

  /**
   * Execute a kit through its full workflow
   */
  async executeKit(sessionId: string, kit: BaseKit, intakeData: KitIntakeData): Promise<KitResult> {
    try {
      const context = this.getOrCreateContext(sessionId, kit.getMetadata().userId);
      this.registerKit(sessionId, kit);

      // Execute full workflow
      const result = await kit.executeFullWorkflow(intakeData);

      // Log completion
      this.logEvent({
        type: 'completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        data: { result },
      });

      return result;
    } catch (error) {
      this.logEvent({
        type: 'error',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  /**
   * Execute kit with stage tracking
   */
  async executeKitWithTracking(
    sessionId: string,
    kit: BaseKit,
    intakeData: KitIntakeData,
    onStageComplete?: (stage: string, state: KitExecutionState) => void
  ): Promise<KitResult> {
    const context = this.getOrCreateContext(sessionId, kit.getMetadata().userId);
    this.registerKit(sessionId, kit);

    try {
      // Intake
      const intakeState = await kit.intake(intakeData);
      this.logEvent({
        type: 'stage-completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        stage: 'intake',
        data: intakeState,
      });
      if (onStageComplete) onStageComplete('intake', intakeState);

      // Analysis
      const analysisState = await kit.analysis();
      this.logEvent({
        type: 'stage-completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        stage: 'analysis',
        data: analysisState,
      });
      if (onStageComplete) onStageComplete('analysis', analysisState);

      // Document
      const documentState = await kit.document();
      this.logEvent({
        type: 'stage-completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        stage: 'document',
        data: documentState,
      });
      if (onStageComplete) onStageComplete('document', documentState);

      // Guidance
      const guidanceState = await kit.guidance();
      this.logEvent({
        type: 'stage-completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        stage: 'guidance',
        data: guidanceState,
      });
      if (onStageComplete) onStageComplete('guidance', guidanceState);

      // Complete
      const result = await kit.complete();
      this.logEvent({
        type: 'completed',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        data: { result },
      });

      return result;
    } catch (error) {
      this.logEvent({
        type: 'error',
        kitId: kit.getMetadata().kitId,
        sessionId,
        timestamp: new Date(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  /**
   * Execute multiple kits concurrently
   */
  async executeMultipleKits(
    sessionId: string,
    kits: Array<{ kit: BaseKit; intakeData: KitIntakeData }>
  ): Promise<KitResult[]> {
    const context = this.getOrCreateContext(sessionId);
    
    // Register all kits
    kits.forEach(({ kit }) => this.registerKit(sessionId, kit));

    // Execute in parallel
    const promises = kits.map(({ kit, intakeData }) =>
      this.executeKit(sessionId, kit, intakeData)
    );

    return Promise.all(promises);
  }

  /**
   * Share state across kits
   */
  shareStateToKit(sessionId: string, kitId: string, key: string, value: any): void {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`No context found for session ${sessionId}`);
    }
    context.sharedState[key] = value;
  }

  /**
   * Get shared state
   */
  getSharedState(sessionId: string, key?: string): any {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`No context found for session ${sessionId}`);
    }
    return key ? context.sharedState[key] : context.sharedState;
  }

  /**
   * Get execution log for a session
   */
  getExecutionLog(sessionId: string): KitExecutionEvent[] {
    const context = this.contexts.get(sessionId);
    return context ? context.executionLog : [];
  }

  /**
   * Subscribe to execution events
   */
  onExecutionEvent(listener: (event: KitExecutionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Log an execution event
   */
  private logEvent(event: KitExecutionEvent): void {
    const context = this.contexts.get(event.sessionId);
    if (context) {
      context.executionLog.push(event);
    }
    this.eventListeners.forEach(listener => listener(event));
  }

  /**
   * Clean up session context (e.g., after timeout or completion)
   */
  cleanupContext(sessionId: string): void {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.activeKits.clear();
      context.executionLog = [];
      this.contexts.delete(sessionId);
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    this.contexts.forEach((context, sessionId) => {
      const age = now - context.startedAt.getTime();
      if (age > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => this.cleanupContext(sessionId));
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get context for a session
   */
  getContext(sessionId: string): KitExecutionContext | undefined {
    return this.contexts.get(sessionId);
  }
}
