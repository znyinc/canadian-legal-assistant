import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';
import { TemplateLibrary } from '../templates/TemplateLibrary';

export class CivilNegligenceDomainModule extends BaseDomainModule {
  domain = 'civil-negligence' as const;

  // Heuristic detection for tree/property damage matters
  supportsMatter(matter: any): boolean {
    const description = (matter.description || '').toLowerCase();
    const tags = (matter.tags || []).map((t: string) => (t || '').toLowerCase());
    return description.includes('tree') || description.includes('fallen') || tags.includes('property-damage') || tags.includes('tree-damage');
  }

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const classification = input.classification || ({} as any);
    const claimant = classification.parties?.names?.[0] || 'Claimant';
    const respondent = 'Respondent';
    const date = classification.timeline?.start || new Date().toISOString();
    const amount = classification.disputeAmount ?? undefined;

    const mkDraft = (title: string, sections: { heading: string; content: string }[]): DocumentDraft => {
      return {
        id: `draft-${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
        title,
        sections: sections.map((s) => ({ heading: s.heading, content: s.content, evidenceRefs: [], confirmed: false })),
        citations: [],
        disclaimer: undefined
      };
    };

    const templates = new TemplateLibrary();
    const drafts: DocumentDraft[] = [];

    // Render demand notice from template
    const demandContent = templates.renderTemplate('civil/demand_notice', {
      respondentName: respondent,
      claimantName: claimant,
      incidentDate: date,
      propertyAddress: classification.notes?.join(', ') || '',
      damageDescription: classification.notes?.join('\n') || '',
      amountClaimed: amount ?? ''
    });

    drafts.push(mkDraft('Demand for Repair / Compensation', [{ heading: 'Demand', content: demandContent }]));

    // Settlement-first demand letter (property damage)
    const demandLetterProperty = templates.renderTemplate('civil/demand_letter_property_damage', {
      respondentName: respondent,
      claimantName: claimant,
      incidentDate: date,
      propertyAddress: classification.notes?.join(', ') || '',
      damageDescription: classification.notes?.join('\n') || '',
      amountClaimed: amount ?? ''
    });
    drafts.push(mkDraft('Demand Letter — Property Damage', [{ heading: 'Demand Letter', content: demandLetterProperty }]));

    // Render Form 7A scaffold
    const formContent = templates.renderTemplate('civil/small_claims_form7a', {
      claimantName: claimant,
      respondentName: respondent,
      amountClaimed: amount ?? '',
      courtLocation: classification.jurisdiction || 'Ontario',
      incidentDate: date,
      particulars: classification.notes?.join('\n') || ''
    });

    drafts.push(mkDraft('Small Claims Court — Form 7A (Statement of Claim)', [{ heading: 'Form 7A (Scaffold)', content: formContent }]));

    // Evidence checklist remains static
    const checklist = templates.renderTemplate('civil/evidence_checklist', {});
    drafts.push(mkDraft('Evidence Checklist — Property Damage', [{ heading: 'Checklist', content: checklist }]));

    // Anticipate the Defense guidance
    const defenseGuide = templates.renderTemplate('civil/anticipate_defense', {});
    drafts.push(mkDraft('Anticipate the Defense — Civil Negligence', [{ heading: 'Defense Preparation', content: defenseGuide }]));

    // Arborist and contractor guidance
    const arborist = templates.renderTemplate('civil/arborist_report_guidance', {});
    drafts.push(mkDraft('Arborist Report Guidance', [{ heading: 'Arborist Report', content: arborist }]));

    const contractor = templates.renderTemplate('civil/contractor_estimate_guidance', {});
    drafts.push(mkDraft('Contractor Estimate Guidance', [{ heading: 'Repair Estimates', content: contractor }]));

    return drafts;
  }
}

