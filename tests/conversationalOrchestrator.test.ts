import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationalOrchestrator } from '../backend/src/services/conversationalOrchestrator';

// Disable LLM calls in tests — briefings should use template fallback
vi.mock('../backend/src/config', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    apiKeyEnabled: false,
    apiKey: '',
    corsOrigin: 'http://localhost:5173',
    uploadDir: './uploads',
    maxFileSize: 10485760,
    canliiApiKey: '',
    nuanceLlmEnabled: false,
    nuanceLlmModel: 'qwen2.5:32b',
    nuanceLlmApiKey: '',
    nuanceLlmBaseUrl: 'http://localhost:11434',
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  },
}));

describe('ConversationalOrchestrator', () => {
  it('processes intake and returns classification envelope', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake('My employer fired me with no notice in Ontario.');

    expect(result.classification).toBeDefined();
    expect(typeof result.classification.domain).toBe('string');
    expect(typeof result.classification.jurisdiction).toBe('string');
    expect(typeof result.classification.confidence).toBe('number');
    expect(typeof result.isComplete).toBe('boolean');
    expect(Array.isArray(result.followUpQuestions)).toBe(true);
  });

  it('uses conversation history to enrich processing', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake('He is not fixing repairs.', [
      { type: 'user', content: 'I am a tenant in Ontario and received an N4 notice.' },
      { type: 'assistant', content: 'Can you share more detail?' },
    ]);

    expect(result.classification.domain).toBeTruthy();
    expect(result.classification.confidence).toBeGreaterThanOrEqual(0);
    expect(result.classification.confidence).toBeLessThanOrEqual(100);
  });

  it('generates follow-up questions when confidence is low', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake('help');

    expect(result.isComplete).toBe(false);
    expect(result.followUpQuestions.length).toBeGreaterThan(0);
  });

  it('does not treat repeated clarifier text as new facts', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake(
      'How were you dismissed email letter in-person meeting or phone and on what date?',
      [
        { type: 'user', content: 'I was fired in Ontario.' },
        {
          type: 'assistant',
          content: 'Thanks, that helps. One quick clarification so I can narrow the path: How were you dismissed (email, letter, in-person meeting, or phone), and on what date?',
        },
      ],
    );

    const assistant = orchestrator.buildIntakeAssistantMessage(result);
    expect(result.unresolvedSignals).toContain('User repeated clarification prompt without adding facts.');
    expect(assistant).toContain('in your own words');
  });

  it('accepts relative date answers for landlord-tenant clarifiers', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake(
      'I received the written notice two days ago and the leak started two weeks ago.',
      [
        { type: 'user', content: 'My landlord sent an N4 notice and will not repair a leak in my unit.' },
        {
          type: 'assistant',
          content: 'Thanks, that helps. One quick clarification so I can narrow the path: When did this issue begin, or when did you receive any written notice?',
        },
      ],
    );

    expect(result.followUpQuestions).not.toContain('When did this issue begin, or when did you receive any written notice?');
  });

  it('completes intake after multiple substantive answers when critical clarifiers are resolved', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake(
      'The main issue is that the landlord served an N4 even though rent is paid, while refusing to repair the leak and the damage is getting worse.',
      [
        { type: 'user', content: 'My landlord sent an N4 notice and will not repair a leak in my unit.' },
        {
          type: 'assistant',
          content: 'Thanks, that helps. One quick clarification so I can narrow the path: When did this issue begin, or when did you receive any written notice?',
        },
        { type: 'user', content: 'I received the written notice two days ago and the leak started two weeks ago.' },
        {
          type: 'assistant',
          content: 'Thanks, that helps. One quick clarification so I can narrow the path: What is the main issue?',
        },
        { type: 'user', content: 'The rent is not unpaid because of the leak, and I have already asked the landlord in writing to repair it.' },
      ],
    );

    expect(result.isComplete).toBe(true);
    expect(result.reviewState).toBe('ready-for-import');
    expect(result.followUpQuestions).toHaveLength(0);
  });

  it('raises intake confidence when a contextual clarifier is answered', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const initialResult = await orchestrator.processIntake('My landlord sent an N4 notice and will not repair a leak in my unit.');

    const followUpResult = await orchestrator.processIntake(
      'I received the written notice two days ago and the leak started two weeks ago.',
      [
        { type: 'user', content: 'My landlord sent an N4 notice and will not repair a leak in my unit.' },
        {
          type: 'assistant',
          content: 'When you said "My landlord sent an N4 notice and will not repair a leak in my unit.", I was not sure about one detail yet. Please answer: When did this issue begin, or when did you receive any written notice? Example answers: "two days ago", "last Friday", "March 3".',
        },
      ],
    );

    expect(followUpResult.confidence).toBeGreaterThan(initialResult.confidence);
    expect(followUpResult.confidenceProgressLabel).toBeTruthy();
  });

  it('returns a confidence hint when clarification is still blocking import', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake('I was fired.');

    expect(result.confidenceHint).toContain('move confidence');
    expect(result.confidenceProgressLabel).toContain('blocking import');
  });

  it('builds reflective clarification prompts with examples', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const userInput = 'I got terminated by email yesterday for cause.';
    const result = await orchestrator.processIntake(userInput);
    const assistantMessage = orchestrator.buildIntakeAssistantMessage(result, userInput);

    expect(assistantMessage).toContain('When you said "I got terminated by email yesterday for cause."');
    expect(assistantMessage).toContain('Please answer:');
    expect(assistantMessage).toContain('Example answers:');
  });

  it('builds interpretive landlord-tenant clarifiers when notice and repair issues are mixed', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processIntake('My landlord gave me an N4 and there is also a leak he will not fix.');
    const assistantMessage = orchestrator.buildIntakeAssistantMessage(
      result,
      'My landlord gave me an N4 and there is also a leak he will not fix.',
    );

    expect(assistantMessage).toContain('did you mean the main problem is the N4 notice, the repairs, or both together');
    expect(assistantMessage).toContain('Please answer:');
  });

  it('returns an action-first nuance response contract', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const result = await orchestrator.processNuanceRespond('My landlord sent an N4 notice and will not repair a leak in my unit.');

    expect(result.context.directAnswer).toContain('landlord and tenant dispute');
    expect(result.context.immediateActions.length).toBeGreaterThan(0);
    expect(result.context.singleNextQuestion).toBeTruthy();
    expect(result.message).toContain('Right now, start with:');
    expect(result.context.conciseDisclaimer).toContain('legal information, not legal advice');
  });

  it('keeps later nuance replies from repeating the same recap', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const first = await orchestrator.processNuanceRespond('My landlord sent an N4 notice and will not repair a leak in my unit.');
    const second = await orchestrator.processNuanceRespond(
      'I also have photos and all the text messages about the leak.',
      [
        { role: 'user', content: 'My landlord sent an N4 notice and will not repair a leak in my unit.' },
        { role: 'assistant', content: first.message },
      ],
    );

    expect(second.context.directAnswer).toContain('That evidence detail helps.');
    expect(second.context.directAnswer).not.toBe(first.context.directAnswer);
  });

  it('updates employment nuance questions from the actual typed details instead of generic status prompts', async () => {
    const orchestrator = new ConversationalOrchestrator();

    const first = await orchestrator.processNuanceRespond('My employer fired me without notice and I want to know my options.');
    const second = await orchestrator.processNuanceRespond(
      'I was fired in an email and no severance was offered. I was told it was a performance issue and that there was companywide restructuring.',
      [
        { role: 'user', content: 'My employer fired me without notice and I want to know my options.' },
        { role: 'assistant', content: first.message },
      ],
    );

    expect(second.context.singleNextQuestion).toContain('On what date were you dismissed or sent the termination message?');
    expect(second.context.singleNextQuestion).not.toContain('Were you terminated, laid off, or did you resign?');
    expect(second.message).toContain('On what date were you dismissed or sent the termination message?');
  });
});
