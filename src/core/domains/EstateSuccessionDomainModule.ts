import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentDraftingEngine } from '../documents/DocumentDraftingEngine';
import { DocumentPackager } from '../documents/DocumentPackager';

export class EstateSuccessionDomainModule extends BaseDomainModule {
  domain = 'estateSuccession' as const;
  private templates: TemplateLibrary;

  constructor(options?: { drafting?: DocumentDraftingEngine; packager?: DocumentPackager }) {
    super(options);
    this.templates = new TemplateLibrary();
  }

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const classification = input.classification as any;
    const names = classification.parties?.names || [];
    const claimantName = names[0] || 'Applicant/Claimant';
    const respondentName = names[1] || 'Estate Trustee / Respondent';
    const issueSummary = classification.description || classification.notes?.[0] || 'Describe the estate issue';
    const probateFile = classification.notes?.find((n: string) => n.toLowerCase().includes('court file')) || 'Court file number (if any)';
    const probateDate = (classification.timeline?.start as string) || 'YYYY-MM-DD';

    const disclaimer = this.templates.disclaimers()[0].body;
    const drafts: DocumentDraft[] = [];

    drafts.push({
      id: `will-challenge-${Date.now()}`,
      title: 'Will Challenge Grounds (Information)',
      sections: [
        {
          heading: 'Grounds Overview',
          content: this.templates.renderTemplate('estate/will_challenge_grounds', {}),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer,
      citations: [],
      styleWarnings: [],
      citationWarnings: [],
      missingConfirmations: ['Confirm factual basis and evidence for each ground before filing.']
    });

    drafts.push({
      id: `probate-guide-${Date.now()}`,
      title: 'Probate / Certificate of Appointment Guide',
      sections: [
        {
          heading: 'Preparation Guide',
          content: this.templates.renderTemplate('estate/probate_application_guide', {}),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer,
      citations: [],
      styleWarnings: [],
      citationWarnings: [],
      missingConfirmations: ['Use latest official probate forms and confirm local filing steps.']
    });

    drafts.push({
      id: `estate-dispute-${Date.now()}`,
      title: 'Estate Dispute Notice (Informational)',
      sections: [
        {
          heading: 'Concerns and Requests',
          content: this.templates.renderTemplate('estate/estate_dispute_notice', {
            claimantName,
            respondentName,
            probateFile,
            issueSummary
          }),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer,
      citations: [],
      styleWarnings: [],
      citationWarnings: [],
      missingConfirmations: ['Confirm standing (beneficiary/dependant) and reference correct court file.']
    });

    drafts.push({
      id: `dependant-support-${Date.now()}`,
      title: 'Dependant Support Claim Procedure (SLRA Part V)',
      sections: [
        {
          heading: 'Steps and Evidence',
          content: this.templates.renderTemplate('estate/dependant_support_procedure', {
            probateDate,
            claimantName
          }),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer,
      citations: [],
      styleWarnings: [],
      citationWarnings: [],
      missingConfirmations: ['File within 6 months of probate issuance where possible; seek legal advice if late.']
    });

    return drafts;
  }
}
