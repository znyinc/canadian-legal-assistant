import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentDraftingEngine } from '../documents/DocumentDraftingEngine';
import { DocumentPackager } from '../documents/DocumentPackager';

export class ConsumerDomainModule extends BaseDomainModule {
  domain = 'consumerProtection' as const;
  private templateLibrary: TemplateLibrary;

  constructor(options?: { drafting?: DocumentDraftingEngine; packager?: DocumentPackager }) {
    super(options);
    this.templateLibrary = new TemplateLibrary();
  }

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const classification = input.classification;
    const parties = (classification as any).parties || {};
    const businessName = parties.respondentName || parties.names?.[1] || 'Business Name';
    const consumerName = parties.claimantName || parties.names?.[0] || 'Consumer Name';
    const serviceDate = (classification as any).timeline?.start || 'YYYY-MM-DD';
    const contractReference = (classification as any).notes?.[0] || 'Contract/Invoice Number';
    const issueSummary = (classification as any).description || 'Describe the issue with the product or service';
    const resolutionRequested = (classification as any).notes?.[1] || 'Describe desired resolution (refund, repair, replacement)';

    const drafts: DocumentDraft[] = [];

    // 1. Consumer Protection Ontario Complaint Guide
    drafts.push({
      id: `cpo-complaint-guide-${Date.now()}`,
      title: 'Consumer Protection Ontario Complaint Guide',
      sections: [
        {
          heading: 'Guide Content',
          content: this.templateLibrary.renderTemplate('consumer/cpo_complaint', {}),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer: this.templateLibrary.disclaimers()[0].body,
      citations: [],
      styleWarnings: [],
      citationWarnings: []
    });

    // 2. Chargeback Request Guide
    drafts.push({
      id: `chargeback-guide-${Date.now()}`,
      title: 'Chargeback Request Guide',
      sections: [
        {
          heading: 'Guide Content',
          content: this.templateLibrary.renderTemplate('consumer/chargeback_guide', {}),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer: this.templateLibrary.disclaimers()[0].body,
      citations: [],
      styleWarnings: [],
      citationWarnings: []
    });

    // 3. Service Dispute Letter
    drafts.push({
      id: `service-dispute-letter-${Date.now()}`,
      title: 'Service Dispute Letter',
      sections: [
        {
          heading: 'Letter Content',
          content: this.templateLibrary.renderTemplate('consumer/service_dispute_letter', {
            businessName,
            consumerName,
            serviceDate,
            contractReference,
            issueSummary,
            resolutionRequested
          }),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer: this.templateLibrary.disclaimers()[0].body,
      citations: [],
      styleWarnings: [],
      citationWarnings: [],
      missingConfirmations: [
        'Confirm business name, service date, and issue details before sending',
        'Attach supporting documents (contract, receipts, photos)'
      ]
    });

    // 4. Unfair Practice Documentation Checklist
    drafts.push({
      id: `unfair-practice-checklist-${Date.now()}`,
      title: 'Unfair Practice Documentation Checklist',
      sections: [
        {
          heading: 'Checklist Content',
          content: this.templateLibrary.renderTemplate('consumer/unfair_practice_documentation', {}),
          evidenceRefs: [],
          confirmed: false
        }
      ],
      disclaimer: this.templateLibrary.disclaimers()[0].body,
      citations: [],
      styleWarnings: [],
      citationWarnings: []
    });

    return drafts;
  }
}
