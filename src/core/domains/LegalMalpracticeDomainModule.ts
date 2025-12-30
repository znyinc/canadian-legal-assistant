import { BaseDomainModule } from './BaseDomainModule';
import { DocumentDraft, DomainModuleInput, DomainModule } from '../models';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { VariableExtractor } from '../documents/VariableExtractor';

export class LegalMalpracticeDomainModule extends BaseDomainModule {
  domain: DomainModule['domain'] = 'legalMalpractice';
  private templates = new TemplateLibrary();
  private extractor = new VariableExtractor();

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const classification = input.classification;
    const notes = (classification as any).notes || [];
    const description = (classification as any).description || notes.join('\n');
    
    // Extract variables using VariableExtractor for consistent data handling
    const extracted = this.extractor.extractFromDescription(description, classification);
    
    // Fallback to helper methods if extractor didn't get the data
    const clientName = extracted.claimantName || this.extractClientName(notes);
    const lawyerName = extracted.respondentName || extracted.lawyerName || this.extractLawyerName(notes);
    const originalClaimType = extracted.underlyingClaimType || this.extractOriginalClaimType(notes);
    const missedDeadline = extracted.deadlineDate || this.extractMissedDeadline(notes);
    const potentialDamages = extracted.amountClaimed || this.extractPotentialDamages(notes, classification.disputeAmount);
    const discoveryDate = extracted.discoveryDate || this.extractDiscoveryDate(notes);

    const drafts: DocumentDraft[] = [];

    // Add forms reference
    const formsRef = this.templates.generateFormsReference('superior-court');

    // 1. LawPRO Immediate Notification Guide
    drafts.push({
      id: `${classification.id}-lawpro-notice`,
      title: 'LawPRO Immediate Notification Guide',
      sections: [],
      content: this.templates.render('malpractice/lawpro_notice', {
        clientName,
        lawyerName,
        originalClaimType,
        missedDeadline,
        discoveryDate
      }),
      type: 'lawpro_notice',
      citations: [],
      missingConfirmations: this.getMissingConfirmationsForLawPRO(
        clientName,
        lawyerName,
        missedDeadline
      )
    } as any);

    // 2. Case-Within-a-Case Analysis Framework
    drafts.push({
      id: `${classification.id}-case-analysis`,
      title: 'Case-Within-a-Case Analysis Framework',
      sections: [],
      content: this.templates.render('malpractice/case_within_case', {
        clientName,
        originalClaimType,
        potentialDamages: String(potentialDamages),
        missedDeadline
      }) + `\n\n${formsRef}`,
      type: 'case_within_case',
      citations: [],
      missingConfirmations: this.getMissingConfirmationsForCaseAnalysis(
        originalClaimType,
        String(potentialDamages)
      )
    } as any);

    // 3. Expert Witness Instruction Letter Template
    drafts.push({
      id: `${classification.id}-expert-instruction`,
      title: 'Expert Witness Instruction Letter Template',
      sections: [],
      content: this.templates.render('malpractice/expert_instruction', {
        clientName,
        lawyerName,
        originalClaimType,
        missedDeadline
      }),
      type: 'expert_instruction',
      citations: [],
      missingConfirmations: this.getMissingConfirmationsForExpert(lawyerName)
    } as any);

    // 4. Formal Demand Letter to Defendant Lawyer
    drafts.push({
      id: `${classification.id}-demand-letter`,
      title: 'Formal Demand Letter to Defendant Lawyer',
      sections: [],
      content: this.templates.render('malpractice/demand_letter', {
        clientName,
        lawyerName,
        originalClaimType,
        missedDeadline,
        potentialDamages: String(potentialDamages),
        discoveryDate
      }),
      type: 'demand_letter',
      citations: [],
      missingConfirmations: this.getMissingConfirmationsForDemand(
        clientName,
        lawyerName,
        String(potentialDamages)
      )
    } as any);

    // 5. Evidence Preservation Checklist for Malpractice Claims
    drafts.push({
      id: `${classification.id}-evidence-checklist`,
      title: 'Evidence Preservation Checklist for Malpractice Claims',
      sections: [],
      content: this.templates.render('malpractice/evidence_checklist', {
        originalClaimType,
        missedDeadline
      }),
      type: 'evidence_checklist',
      citations: [],
      missingConfirmations: []
    } as any);

    return drafts;
  }

  private extractClientName(notes: string[]): string {
    const clientPattern = /client.*?([A-Z][a-z]+ [A-Z][a-z]+)/i;
    for (const note of notes) {
      const match = note.match(clientPattern);
      if (match) return match[1];
    }
    return '{{clientName}}';
  }

  private extractLawyerName(notes: string[]): string {
    const lawyerPattern = /lawyer.*?([A-Z][a-z]+ [A-Z][a-z]+)|defendant.*?([A-Z][a-z]+ [A-Z][a-z]+)/i;
    for (const note of notes) {
      const match = note.match(lawyerPattern);
      if (match) return match[1] || match[2];
    }
    return '{{defendantLawyerName}}';
  }

  private extractOriginalClaimType(notes: string[]): string {
    const typePatterns = [
      /original (.*?) claim/i,
      /underlying (.*?) matter/i,
      /slip.?and.?fall/i,
      /personal injury/i,
      /contract dispute/i,
      /employment/i
    ];
    
    for (const note of notes) {
      for (const pattern of typePatterns) {
        const match = note.match(pattern);
        if (match) {
          if (match[1]) return match[1];
          if (pattern.source.includes('slip')) return 'slip-and-fall personal injury';
        }
      }
    }
    return '{{originalClaimType}}';
  }

  private extractMissedDeadline(notes: string[]): string {
    const deadlinePattern = /deadline.*?(\d{4}-\d{2}-\d{2})|limitation.*?(\d{4}-\d{2}-\d{2})/i;
    for (const note of notes) {
      const match = note.match(deadlinePattern);
      if (match) return match[1] || match[2];
    }
    return '{{missedDeadlineDate}}';
  }

  private extractPotentialDamages(notes: string[], disputeAmount?: number): string {
    if (disputeAmount) return `$${disputeAmount.toLocaleString()}`;
    
    const amountPattern = /\$([0-9,]+)/;
    for (const note of notes) {
      const match = note.match(amountPattern);
      if (match) return `$${match[1]}`;
    }
    return '{{potentialDamagesAmount}}';
  }

  private extractDiscoveryDate(notes: string[]): string {
    const discoveryPattern = /discover.*?(\d{4}-\d{2}-\d{2})|realiz.*?(\d{4}-\d{2}-\d{2})/i;
    for (const note of notes) {
      const match = note.match(discoveryPattern);
      if (match) return match[1] || match[2];
    }
    return '{{discoveryDate}}';
  }

  private getMissingConfirmationsForLawPRO(
    clientName: string,
    lawyerName: string,
    missedDeadline: string
  ): string[] {
    const missing: string[] = [];
    if (clientName.startsWith('{{')) {
      missing.push('Confirm client name for LawPRO notification');
    }
    if (lawyerName.startsWith('{{')) {
      missing.push('Confirm defendant lawyer name and contact information');
    }
    if (missedDeadline.startsWith('{{')) {
      missing.push('Confirm the specific deadline that was missed');
    }
    return missing;
  }

  private getMissingConfirmationsForCaseAnalysis(
    originalClaimType: string,
    potentialDamages: string
  ): string[] {
    const missing: string[] = [];
    if (originalClaimType.startsWith('{{')) {
      missing.push('Confirm the type of underlying claim (slip-and-fall, contract, employment, etc.)');
    }
    if (potentialDamages.startsWith('{{')) {
      missing.push('Estimate the potential damages value of the original claim');
    }
    missing.push('Gather evidence from the original claim to assess likelihood of success');
    return missing;
  }

  private getMissingConfirmationsForExpert(lawyerName: string): string[] {
    const missing: string[] = [];
    if (lawyerName.startsWith('{{')) {
      missing.push('Confirm defendant lawyer name and practice area');
    }
    missing.push('Identify qualified legal malpractice expert (ideally in same practice area)');
    return missing;
  }

  private getMissingConfirmationsForDemand(
    clientName: string,
    lawyerName: string,
    potentialDamages: string
  ): string[] {
    const missing: string[] = [];
    if (clientName.startsWith('{{')) {
      missing.push('Confirm client full legal name and contact information');
    }
    if (lawyerName.startsWith('{{')) {
      missing.push('Confirm defendant lawyer full name, firm, and mailing address');
    }
    if (potentialDamages.startsWith('{{')) {
      missing.push('Calculate estimated damages (original claim value + legal costs incurred)');
    }
    return missing;
  }
}
