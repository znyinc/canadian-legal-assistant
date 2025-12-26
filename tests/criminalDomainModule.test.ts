import { describe, it, expect } from 'vitest';
import { CriminalDomainModule } from '../src/core/domains/CriminalDomainModule';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('CriminalDomainModule', () => {
  const module = new CriminalDomainModule();

  it('identifies as criminal domain', () => {
    expect(module.domain).toBe('criminal');
    expect(module.name).toContain('Criminal');
  });

  it('applies to assault classifications', () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
      partyName: 'John Doe',
    };
    expect(module.isApplicable(classification as any)).toBe(true);
  });

  it('applies to uttering threats classifications', () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'uttering-threats',
    };
    expect(module.isApplicable(classification as any)).toBe(true);
  });

  it('rejects non-criminal domains', () => {
    const classification = {
      domain: 'civil-negligence',
      subCategory: 'assault',
    };
    expect(module.isApplicable(classification as any)).toBe(false);
  });

  it('rejects other criminal categories', () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'fraud',
    };
    expect(module.isApplicable(classification as any)).toBe(false);
  });

  it('generates release conditions checklist draft', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
      partyName: 'Jane Smith',
    };

    const evidenceManifest = {
      matterId: 'test-1',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const checklistDraft = drafts.find((d) => d.title === 'Release Conditions Checklist');
    expect(checklistDraft).toBeDefined();
    expect(checklistDraft!.title).toContain('Release Conditions');
    const sectionContent = checklistDraft!.sections[0].content;
    expect(sectionContent).toContain('Jane Smith');
    expect(sectionContent).toContain('fixed address');
    expect(sectionContent).toContain('bail supervisor');
  });

  it('generates victim impact statement scaffold', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
      claimantType: 'Victim',
    };

    const evidenceManifest = {
      matterId: 'test-2',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const victimDraft = drafts.find((d) => d.title === 'Victim Impact Statement (Scaffold)');
    expect(victimDraft).toBeDefined();
    expect(victimDraft!.title).toContain('Victim Impact Statement');
    const sectionContent = victimDraft!.sections[0].content;
    expect(sectionContent).toContain('Physical Effects');
    expect(sectionContent).toContain('Emotional Effects');
    expect(sectionContent).toContain('Financial Effects');
  });

  it('generates police/crown process guide', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'uttering-threats',
    };

    const evidenceManifest = {
      matterId: 'test-3',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const guideDraft = drafts.find((d) => d.title.includes('Police and Crown Process'));
    expect(guideDraft).toBeDefined();
    expect(guideDraft!.title).toContain('Police and Crown Process');
    const sectionContent = guideDraft!.sections[0].content;
    expect(sectionContent).toContain('uttering threats');
    expect(sectionContent).toContain('Crown Attorney');
    expect(sectionContent).toContain('release hearing');
  });

  it('marks content as information-only', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-4',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const guideDraft = drafts.find((d) => d.title.includes('Police and Crown Process'));
    expect(guideDraft!.title).toContain('Information');
  });

  it('includes event metadata for all drafts', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-5',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    expect(drafts.length).toBeGreaterThan(0);
    drafts.forEach((draft) => {
      expect(draft.id).toBeDefined();
      expect(draft.title).toBeDefined();
      expect(draft.sections).toBeDefined();
      expect(draft.sections.length).toBeGreaterThan(0);
    });
  });

  it('includes templates in package output', async () => {
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-6',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { manifests } = await module.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    expect(manifests.length).toBeGreaterThan(0);
    expect(manifests[0].items).toBeDefined();
  });
});

describe('Criminal Domain Templates', () => {
  const templateLib = new TemplateLibrary();

  it('provides release conditions checklist template', () => {
    const templates = templateLib.domainTemplates();
    expect(templates['criminal/release_conditions_checklist']).toBeDefined();
    expect(templates['criminal/release_conditions_checklist']).toContain('Release Conditions');
    expect(templates['criminal/release_conditions_checklist']).toContain('fixed address');
  });

  it('provides victim impact scaffold template', () => {
    const templates = templateLib.domainTemplates();
    expect(templates['criminal/victim_impact_scaffold']).toBeDefined();
    expect(templates['criminal/victim_impact_scaffold']).toContain('Physical Effects');
    expect(templates['criminal/victim_impact_scaffold']).toContain('Crown counsel');
  });

  it('provides police/crown process guide template', () => {
    const templates = templateLib.domainTemplates();
    expect(templates['criminal/police_crown_process_guide']).toBeDefined();
    expect(templates['criminal/police_crown_process_guide']).toContain('Crown Attorney');
    expect(templates['criminal/police_crown_process_guide']).toContain('victim services');
  });

  it('renders release conditions with placeholder substitution', () => {
    const templates = templateLib.domainTemplates();
    const template = templates['criminal/release_conditions_checklist'];
    const rendered = template.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      const context = { fullName: 'Test Accused', date: '2025-12-26' };
      return (context as any)[key] || '';
    });

    expect(rendered).toContain('Test Accused');
    expect(rendered).toContain('2025-12-26');
    expect(rendered).toContain('fixed address');
  });

  it('renders victim impact with victim role', () => {
    const templates = templateLib.domainTemplates();
    const template = templates['criminal/victim_impact_scaffold'];
    const rendered = template.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      const context = { victimRole: 'Assault Victim', date: '2025-12-26' };
      return (context as any)[key] || '';
    });

    expect(rendered).toContain('Assault Victim');
    expect(rendered).toContain('Time Impact');
  });

  it('renders police/crown guide with offense type', () => {
    const templateLib = new TemplateLibrary();
    const template = templateLib.renderTemplate('criminal/police_crown_process_guide', {
      offense: 'uttering threats',
      province: 'Ontario',
    });

    expect(template).toContain('uttering threats');
    expect(template).toContain('Ontario');
  });
});
