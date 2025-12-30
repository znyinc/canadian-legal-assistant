import { describe, it, expect } from 'vitest';
import { MatterClassifier } from '../src/core/triage/MatterClassifier';

describe('MatterClassifier - Legal Malpractice Detection', () => {
  const classifier = new MatterClassifier();

  it('should classify "malpractice" keyword as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'legal malpractice claim against former lawyer'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "solicitor negligence" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'solicitor negligence - missed deadline'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "lawyer negligence" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'lawyer negligence case'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "professional negligence" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'professional negligence by attorney'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "missed limitation" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'my lawyer missed limitation period'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "missed deadline" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'attorney missed deadline to file statement of claim'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "legal error" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'legal error by my former counsel'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "retainer breach" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'breach of retainer agreement by lawyer'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "lawpro" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'need to notify lawpro about lawyer error'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should classify "case within a case" as legalMalpractice', () => {
    const result = classifier.classify({
      domainHint: 'case within a case doctrine applies'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should NOT classify general civil negligence as malpractice', () => {
    const result = classifier.classify({
      domainHint: 'slip and fall at grocery store'
    });
    expect(result.domain).toBe('civil-negligence');
  });

  it('should prioritize malpractice over civil negligence when both keywords present', () => {
    const result = classifier.classify({
      domainHint:
        'lawyer missed deadline for my slip-and-fall negligence claim - solicitor malpractice'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should handle case insensitivity', () => {
    const result = classifier.classify({
      domainHint: 'LEGAL MALPRACTICE - Missed Limitation Period'
    });
    expect(result.domain).toBe('legalMalpractice');
  });

  it('should extract disputeAmount for damages calculation', () => {
    const result = classifier.classify({
      domainHint: 'lawyer malpractice',
      disputeAmount: 100000
    });
    expect(result.domain).toBe('legalMalpractice');
    expect(result.disputeAmount).toBe(100000);
  });

  it('should preserve Ontario jurisdiction for malpractice claims', () => {
    const result = classifier.classify({
      domainHint: 'legal malpractice in Toronto',
      jurisdictionHint: 'Ontario'
    });
    expect(result.domain).toBe('legalMalpractice');
    expect(result.jurisdiction).toBe('Ontario');
  });
});
