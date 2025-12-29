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

  it('generates victim services guide', async () => {
    const criminalModule = new CriminalDomainModule();
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-victim-services',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await criminalModule.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const victimServicesDraft = drafts.find((d) => d.title.includes('Victim Services'));
    expect(victimServicesDraft).toBeDefined();
    expect(victimServicesDraft!.title).toContain('Victim Services Ontario');
    const content = victimServicesDraft!.sections[0].content;
    expect(content).toContain('V/WAP');
    expect(content).toContain('Court accompaniment');
    expect(content).toContain('416-314-2447');
  });

  it('generates criminal evidence checklist', async () => {
    const criminalModule = new CriminalDomainModule();
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-evidence-checklist',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await criminalModule.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const evidenceChecklistDraft = drafts.find((d) => d.title.includes('Evidence Checklist'));
    expect(evidenceChecklistDraft).toBeDefined();
    expect(evidenceChecklistDraft!.title).toContain('Criminal Complainant');
    const content = evidenceChecklistDraft!.sections[0].content;
    expect(content).toContain('Medical Documentation');
    expect(content).toContain('occurrence number');
    expect(content).toContain('Screenshot');
    expect(content).toContain('Witnesses');
  });

  it('generates complainant role explanation', async () => {
    const criminalModule = new CriminalDomainModule();
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
    };

    const evidenceManifest = {
      matterId: 'test-role-guide',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await criminalModule.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    const roleDraft = drafts.find((d) => d.title.includes('Role as Complainant'));
    expect(roleDraft).toBeDefined();
    const content = roleDraft!.sections[0].content;
    expect(content).toContain('witness, not a party');
    expect(content).toContain('Crown Attorney');
    expect(content).toContain('peace bond');
    expect(content).toContain('810');
  });

  it('includes all six criminal drafts for assault', async () => {
    const criminalModule = new CriminalDomainModule();
    const classification = {
      domain: 'criminal',
      subCategory: 'assault',
      notes: ['assault'],
    };

    const evidenceManifest = {
      matterId: 'test-all-drafts',
      description: 'Test evidence',
      sources: [],
      items: [],
      compiledAt: new Date(),
    };

    const { drafts } = await criminalModule.generateDocuments(
      classification as any,
      {},
      [],
      evidenceManifest,
    );

    // Should have: release conditions, victim impact, police/crown guide, victim services, evidence checklist, complainant role, 10-step checklist
    expect(drafts.length).toBe(7);
    expect(drafts.some((d) => d.title.includes('Release Conditions'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('Victim Impact'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('Police and Crown'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('Victim Services'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('Evidence Checklist'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('Complainant'))).toBe(true);
    expect(drafts.some((d) => d.title.includes('10-Step'))).toBe(true);
  });

  it('generates comprehensive 10-step next steps checklist', async () => {
    const criminalModule = new CriminalDomainModule();

    const classification: Partial<MatterClassification> = {
      id: 'assault-case',
      domain: 'criminal',
      jurisdiction: 'Ontario',
      notes: ['Assault', 'Neighbor dispute'],
      timeline: '2025-12-21',
    };

    const { drafts } = await criminalModule.generateDocuments(
      classification as any,
      {},
      [],
    );

    // Find the 10-step checklist
    const checklistDraft = drafts.find((d) => d.title.includes('10-Step'));
    expect(checklistDraft).toBeDefined();
    expect(checklistDraft?.title).toContain('10-Step Next Steps Checklist');

    // Verify content includes all major sections
    const content = checklistDraft?.sections?.[0]?.content || '';
    expect(content).toContain('1. Immediate Criminal Process');
    expect(content).toContain('2. Your Role as Complainant');
    expect(content).toContain('3. Medical & Documentation Steps');
    expect(content).toContain('4. Victim Services');
    expect(content).toContain('5. Peace Bond / Restraining Options');
    expect(content).toContain('6. Civil Liability');
    expect(content).toContain('7. Victim Impact Statement');
    expect(content).toContain('8. What You Should Avoid');
    expect(content).toContain('9. Likely Legal Trajectory');
    expect(content).toContain('10. If You Want Next-Step Help');
  });
});
