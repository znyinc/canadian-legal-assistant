import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('TemplateLibrary', () => {
  it('provides disclaimers', () => {
    const lib = new TemplateLibrary();
    const disclaimers = lib.disclaimers();
    expect(disclaimers.length).toBeGreaterThan(0);
    expect(disclaimers[0].body).toContain('legal information');
  });

  it('provides package layout template', () => {
    const lib = new TemplateLibrary();
    const pkg = lib.packageLayout();
    expect(pkg.folders).toContain('evidence/');
    expect(pkg.files).toContain('manifests/evidence_index.json');
  });

  it('provides formatting guidance', () => {
    const lib = new TemplateLibrary();
    const tips = lib.formattingGuidance();
    expect(tips.some((t) => t.toLowerCase().includes('retrieval'))).toBe(true);
  });

  it('exposes domain templates', () => {
    const lib = new TemplateLibrary();
    const templates = lib.domainTemplates();
    expect(Object.keys(templates).length).toBeGreaterThan(0);
    expect(templates['civil/demand_notice']).toBeDefined();
  });
});
