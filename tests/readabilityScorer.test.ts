import { describe, it, expect } from 'vitest';
import { ReadabilityScorer } from '../src/core/language/ReadabilityScorer';

describe('ReadabilityScorer', () => {
  it('should score simple text as easy', () => {
    const scorer = new ReadabilityScorer();
    const result = scorer.score('The cat sat on the mat. It was a nice day.');
    
    expect(result.score).toBeGreaterThan(70);
    expect(['very-easy', 'easy']).toContain(result.grade);
    expect(result.gradeLevel).toBeLessThan(10);
  });

  it('should score complex legal text as difficult', () => {
    const scorer = new ReadabilityScorer();
    const result = scorer.score(
      'The plaintiff alleges that the defendant breached their contractual obligations by failing to provide adequate consideration, thereby constituting a fundamental breach of the agreement which entitled the plaintiff to rescind the contract and claim damages for the consequential losses sustained as a result of the defendant\'s negligent misrepresentation.'
    );
    
    expect(result.score).toBeLessThan(50);
    expect(['difficult', 'very-difficult']).toContain(result.grade);
    expect(result.gradeLevel).toBeGreaterThan(10);
  });

  it('should provide suggestions for improvement', () => {
    const scorer = new ReadabilityScorer();
    const longSentence = 'This is a very long sentence that continues on and on with many clauses and subclauses and compound predicates and multiple conjunctions that make it difficult to follow and understand what the main point is supposed to be.';
    
    const result = scorer.score(longSentence);
    
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.some(s => s.includes('shorter'))).toBe(true);
  });

  it('should detect legal terms and penalize complexity', () => {
    const scorer = new ReadabilityScorer();
    
    const plainText = 'The person who started the case must prove their claims.';
    const legalText = 'The plaintiff must establish liability through preponderance of evidence.';
    
    const plainScore = scorer.score(plainText);
    const legalScore = scorer.score(legalText);
    
    expect(plainScore.score).toBeGreaterThan(legalScore.score);
    expect(legalScore.metrics.legalTermCount).toBeGreaterThan(0);
  });

  it('should calculate accurate metrics', () => {
    const scorer = new ReadabilityScorer();
    const text = 'Short sentence. Another short one. And a third.';
    
    const result = scorer.score(text);
    
    expect(result.metrics.avgSentenceLength).toBeCloseTo(3, 0);
    expect(result.metrics.avgWordLength).toBeGreaterThan(0);
    expect(result.metrics.syllablesPerWord).toBeGreaterThan(0);
  });

  it('should handle empty or very short text', () => {
    const scorer = new ReadabilityScorer();
    
    const result = scorer.score('Hi.');
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metrics).toBeDefined();
  });

  it('should suggest tooltip explanations for legal terms', () => {
    const scorer = new ReadabilityScorer();
    const text = 'The plaintiff must prove negligence and damages to the defendant in this liability case.';
    
    const result = scorer.score(text);
    
    expect(result.metrics.legalTermCount).toBeGreaterThan(0);
    const hasTooltipSuggestion = result.suggestions.some(s => 
      s.includes('tooltip') || s.includes('plain language')
    );
    expect(hasTooltipSuggestion).toBe(true);
  });

  it('should provide grade descriptions', () => {
    const scorer = new ReadabilityScorer();
    
    expect(scorer.gradeDescription('very-easy')).toContain('11-year-olds');
    expect(scorer.gradeDescription('difficult')).toContain('post-secondary');
  });

  it('should count complex words correctly', () => {
    const scorer = new ReadabilityScorer();
    
    const simple = 'The cat ran fast.';
    const complex = 'The organization demonstrated extraordinary accountability.';
    
    const simpleResult = scorer.score(simple);
    const complexResult = scorer.score(complex);
    
    expect(complexResult.metrics.complexWordCount).toBeGreaterThan(simpleResult.metrics.complexWordCount);
  });
});
