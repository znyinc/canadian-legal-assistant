import { describe, it, expect } from 'vitest';
import { TermDictionary } from '../src/core/language/TermDictionary';

describe('TermDictionary', () => {
  it('should look up common legal terms', () => {
    const dict = new TermDictionary();
    
    const plaintiff = dict.lookup('plaintiff');
    expect(plaintiff).toBeDefined();
    expect(plaintiff?.plainLanguage).toBe('the person suing');
    expect(plaintiff?.category).toBe('party');
  });

  it('should be case-insensitive', () => {
    const dict = new TermDictionary();
    
    const lower = dict.lookup('plaintiff');
    const upper = dict.lookup('PLAINTIFF');
    const mixed = dict.lookup('PlAiNtIfF');
    
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
  });

  it('should translate terms to plain language', () => {
    const dict = new TermDictionary();
    
    expect(dict.translate('defendant')).toBe('the person being sued');
    expect(dict.translate('unknown-term')).toBe('unknown-term');
  });

  it('should search terms by keyword', () => {
    const dict = new TermDictionary();
    
    const results = dict.search('tribunal');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.term.includes('Landlord and Tenant Board'))).toBe(true);
  });

  it('should filter terms by category', () => {
    const dict = new TermDictionary();
    
    const forumTerms = dict.getByCategory('forum');
    expect(forumTerms.length).toBeGreaterThan(0);
    expect(forumTerms.every(t => t.category === 'forum')).toBe(true);
    
    const partyTerms = dict.getByCategory('party');
    expect(partyTerms.some(t => t.term === 'plaintiff')).toBe(true);
    expect(partyTerms.some(t => t.term === 'defendant')).toBe(true);
  });

  it('should support adding custom terms', () => {
    const dict = new TermDictionary();
    
    dict.addTerm({
      term: 'test-term',
      plainLanguage: 'test translation',
      explanation: 'test explanation',
      category: 'general',
    });
    
    const term = dict.lookup('test-term');
    expect(term).toBeDefined();
    expect(term?.plainLanguage).toBe('test translation');
  });

  it('should include Ontario-specific terms', () => {
    const dict = new TermDictionary();
    
    const ltb = dict.lookup('Landlord and Tenant Board');
    expect(ltb).toBeDefined();
    expect(ltb?.jurisdiction).toBe('ontario');
    expect(ltb?.learnMoreUrl).toContain('tribunalsontario.ca');
    
    const smallClaims = dict.lookup('Small Claims Court');
    expect(smallClaims).toBeDefined();
    expect(smallClaims?.explanation).toContain('$50,000');
  });

  it('should include learn more URLs for key terms', () => {
    const dict = new TermDictionary();
    
    const limitationPeriod = dict.lookup('limitation period');
    expect(limitationPeriod?.learnMoreUrl).toBeDefined();
    expect(limitationPeriod?.learnMoreUrl).toContain('ontario.ca');
  });

  it('should cover all major categories', () => {
    const dict = new TermDictionary();
    
    expect(dict.getByCategory('procedural').length).toBeGreaterThan(0);
    expect(dict.getByCategory('substantive').length).toBeGreaterThan(0);
    expect(dict.getByCategory('forum').length).toBeGreaterThan(0);
    expect(dict.getByCategory('remedy').length).toBeGreaterThan(0);
    expect(dict.getByCategory('party').length).toBeGreaterThan(0);
    expect(dict.getByCategory('general').length).toBeGreaterThan(0);
  });
});
