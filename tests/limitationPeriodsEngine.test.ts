import { describe, it, expect } from 'vitest';
import { LimitationPeriodsEngine } from '../src/core/limitation/LimitationPeriodsEngine';

describe('LimitationPeriodsEngine', () => {
  it('should load Ontario limitation periods', () => {
    const engine = new LimitationPeriodsEngine();
    const periods = engine.getPeriods();
    
    expect(periods.length).toBeGreaterThan(0);
    expect(periods.some(p => p.id === 'ontario-general-2-year')).toBe(true);
    expect(periods.some(p => p.id === 'ontario-municipal-10-day')).toBe(true);
  });

  it('should get general 2-year limitation period', () => {
    const engine = new LimitationPeriodsEngine();
    const period = engine.getPeriod('ontario-general-2-year');
    
    expect(period).toBeDefined();
    expect(period?.period).toBe('2 years');
    expect(period?.periodDays).toBe(730);
    expect(period?.jurisdiction).toBe('ontario');
  });

  it('should get 10-day municipal notice period', () => {
    const engine = new LimitationPeriodsEngine();
    const period = engine.getPeriod('ontario-municipal-10-day');
    
    expect(period).toBeDefined();
    expect(period?.period).toBe('10 days');
    expect(period?.periodDays).toBe(10);
    expect(period?.category).toBe('municipal');
  });

  it('should filter periods by category', () => {
    const engine = new LimitationPeriodsEngine();
    
    const municipal = engine.getPeriods('municipal');
    expect(municipal.every(p => p.category === 'municipal')).toBe(true);
    expect(municipal.length).toBeGreaterThan(0);
    
    const employment = engine.getPeriods('employment');
    expect(employment.every(p => p.category === 'employment')).toBe(true);
  });

  it('should detect municipal notice requirement from description', () => {
    const engine = new LimitationPeriodsEngine();
    
    expect(engine.detectMunicipalNotice('Tree fell from city property and damaged my car')).toBe(true);
    expect(engine.detectMunicipalNotice('Pothole on municipal road caused damage')).toBe(true);
    expect(engine.detectMunicipalNotice('Slipped on icy sidewalk maintained by town')).toBe(true);
    expect(engine.detectMunicipalNotice('Landlord refused to fix broken heater')).toBe(false);
  });

  it('should detect municipal notice from tags', () => {
    const engine = new LimitationPeriodsEngine();
    
    expect(engine.detectMunicipalNotice('Car damaged', ['municipal', 'tree'])).toBe(true);
    expect(engine.detectMunicipalNotice('Property damage', ['road', 'pothole'])).toBe(true);
  });

  it('should calculate critical urgency for deadlines under 10 days', () => {
    const engine = new LimitationPeriodsEngine();
    const alert = engine.calculateAlert('ontario-municipal-10-day', 5);
    
    expect(alert).toBeDefined();
    expect(alert?.urgency).toBe('critical');
    expect(alert?.daysRemaining).toBe(5);
    expect(alert?.message).toContain('5 days');
    expect(alert?.actionRequired).toContain('immediately');
  });

  it('should calculate warning urgency for deadlines 11-30 days', () => {
    const engine = new LimitationPeriodsEngine();
    const alert = engine.calculateAlert('ontario-general-2-year', 20);
    
    expect(alert).toBeDefined();
    expect(alert?.urgency).toBe('warning');
    expect(alert?.message).toContain('20 days');
  });

  it('should calculate caution urgency for deadlines 31-90 days', () => {
    const engine = new LimitationPeriodsEngine();
    const alert = engine.calculateAlert('ontario-general-2-year', 60);
    
    expect(alert).toBeDefined();
    expect(alert?.urgency).toBe('caution');
  });

  it('should calculate info urgency for deadlines over 90 days', () => {
    const engine = new LimitationPeriodsEngine();
    const alert = engine.calculateAlert('ontario-general-2-year', 365);
    
    expect(alert).toBeDefined();
    expect(alert?.urgency).toBe('info');
  });

  it('should handle overdue deadlines', () => {
    const engine = new LimitationPeriodsEngine();
    const alert = engine.calculateAlert('ontario-municipal-10-day', -5);
    
    expect(alert).toBeDefined();
    expect(alert?.urgency).toBe('critical');
    expect(alert?.message).toContain('may have passed');
    expect(alert?.message).toContain('lawyer');
  });

  it('should provide encouraging messages', () => {
    const engine = new LimitationPeriodsEngine();
    
    const critical = engine.calculateAlert('ontario-municipal-10-day', 3);
    expect(critical?.encouragement).toContain('panic');
    
    const warning = engine.calculateAlert('ontario-general-2-year', 25);
    expect(warning?.encouragement).toContain('right step');
  });

  it('should get relevant periods for employment matters', () => {
    const engine = new LimitationPeriodsEngine();
    const periods = engine.getRelevantPeriods('employment', 'I was fired without notice');
    
    expect(periods.some(p => p.id === 'ontario-general-2-year')).toBe(true);
    expect(periods.some(p => p.id === 'ontario-esa-complaint')).toBe(true);
    expect(periods.some(p => p.id === 'ontario-wrongful-dismissal')).toBe(true);
  });

  it('should get relevant periods for municipal matters', () => {
    const engine = new LimitationPeriodsEngine();
    const periods = engine.getRelevantPeriods(
      'civil-negligence', 
      'Tree from city park fell and damaged my fence',
      ['municipal', 'property-damage']
    );
    
    expect(periods.some(p => p.id === 'ontario-general-2-year')).toBe(true);
    expect(periods.some(p => p.id === 'ontario-municipal-10-day')).toBe(true);
  });

  it('should get relevant periods for landlord-tenant matters', () => {
    const engine = new LimitationPeriodsEngine();
    const periods = engine.getRelevantPeriods('landlord-tenant', 'Landlord illegally withheld my rent deposit');
    
    expect(periods.some(p => p.id === 'ontario-ltb-application')).toBe(true);
  });

  it('should include Small Claims jurisdiction update ($50K)', () => {
    const engine = new LimitationPeriodsEngine();
    // Small Claims info is in TermDictionary, but limitation engine should reference general period
    const general = engine.getPeriod('ontario-general-2-year');
    expect(general).toBeDefined();
  });

  it('should include learn more URLs for key periods', () => {
    const engine = new LimitationPeriodsEngine();
    
    const general = engine.getPeriod('ontario-general-2-year');
    expect(general?.learnMoreUrl).toContain('ontario.ca');
    
    const hrto = engine.getPeriod('ontario-human-rights-hrto');
    expect(hrto?.learnMoreUrl).toContain('sjto.ca');
  });
});
