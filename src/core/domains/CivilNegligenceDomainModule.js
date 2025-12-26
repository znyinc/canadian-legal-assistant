import { BaseDomainModule } from './BaseDomainModule';
import { TemplateLibrary } from '../templates/TemplateLibrary';
export class CivilNegligenceDomainModule extends BaseDomainModule {
    domain = 'civil-negligence';
    // Heuristic detection for tree/property damage matters
    supportsMatter(matter) {
        const description = (matter.description || '').toLowerCase();
        const tags = (matter.tags || []).map((t) => (t || '').toLowerCase());
        return description.includes('tree') || description.includes('fallen') || tags.includes('property-damage') || tags.includes('tree-damage');
    }
    buildDrafts(input) {
        const classification = input.classification || {};
        const claimant = classification.parties?.names?.[0] || 'Claimant';
        const respondent = 'Respondent';
        const date = classification.timeline?.start || new Date().toISOString();
        const amount = classification.disputeAmount ?? undefined;
        const mkDraft = (title, sections) => {
            return {
                id: `draft-${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
                title,
                sections: sections.map((s) => ({ heading: s.heading, content: s.content, evidenceRefs: [], confirmed: false })),
                citations: [],
                disclaimer: undefined
            };
        };
        const templates = new TemplateLibrary();
        const drafts = [];
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
        return drafts;
    }
}
//# sourceMappingURL=CivilNegligenceDomainModule.js.map