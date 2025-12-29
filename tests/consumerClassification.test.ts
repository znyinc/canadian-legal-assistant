import { describe, it, expect } from 'vitest';
import { MatterClassifier } from '../src/core/triage/MatterClassifier';

describe('MatterClassifier - Consumer Protection Detection', () => {
  const classifier = new MatterClassifier();

  it('classifies consumer refund request as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'consumer refund request',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
    expect(result.jurisdiction).toBe('Ontario');
  });

  it('classifies warranty dispute as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'warranty dispute with business',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
  });

  it('classifies service complaint as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'poor service quality',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
  });

  it('classifies unfair business practice as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'unfair advertising',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
  });

  it('classifies chargeback scenario as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'chargeback for undelivered goods',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
  });

  it('classifies explicit consumer keyword as consumerProtection', () => {
    const result = classifier.classify({
      domainHint: 'consumer complaint',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('consumerProtection');
  });
});
