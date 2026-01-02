/**
 * PDFSummaryGenerator: Creates professional "Case Summary" PDFs from form mappings
 * 
 * PURPOSE: Phase A of Hybrid Model - generate clean, well-formatted data summaries
 * UPL COMPLIANCE: Clearly labeled "NOT AN OFFICIAL DOCUMENT" with links to official forms
 * 
 * Output Format:
 * - Header: "Summary of Information for [Form Name]"
 * - Disclaimer: "This is information only, not an official court document"
 * - Visual Mapping Table: Official Form Section → Your Information
 * - Footer: Download link to official form + legal disclaimer
 */

import { FormMappingRegistry } from '../templates/FormMappingRegistry';

export interface PDFSummaryOptions {
  /** Form ID to generate summary for */
  formId: string;
  
  /** User's variable data */
  variables: Record<string, any>;
  
  /** Optional: User's matter ID for tracking */
  matterId?: string;
  
  /** Optional: Include full filing guide (default: true) */
  includeFilingGuide?: boolean;
  
  /** Optional: Custom header/footer text */
  customHeader?: string;
  customFooter?: string;
}

export interface PDFSummaryResult {
  /** Markdown content for the summary */
  markdownContent: string;
  
  /** Metadata for PDF generation */
  metadata: {
    formName: string;
    authority: string;
    generatedDate: string;
    matterId?: string;
  };
  
  /** Suggested filename */
  filename: string;
}

export class PDFSummaryGenerator {
  private registry: FormMappingRegistry;

  constructor() {
    this.registry = new FormMappingRegistry();
  }

  /**
   * Generate a professional data summary for a specific form
   * Returns Markdown content ready for PDF conversion
   */
  generateSummary(options: PDFSummaryOptions): PDFSummaryResult {
    const mapping = this.registry.getMapping(options.formId);
    if (!mapping) {
      throw new Error(`No form mapping found for: ${options.formId}`);
    }

    const dataSummary = this.registry.generateDataSummary(options.formId, options.variables);
    const generatedDate = new Date().toISOString().split('T')[0];

    // Build Markdown content
    let content = '';

    // Header Section
    content += this.generateHeader(
      dataSummary.formName,
      options.customHeader || `Summary of Information for ${dataSummary.formName}`
    );

    // Prominent Disclaimer
    content += this.generateDisclaimer(dataSummary.formName, dataSummary.officialUrl);

    // Data Summary Table
    content += this.generateDataTable(dataSummary);

    // Optional: Full Filing Guide
    if (options.includeFilingGuide !== false) {
      const filingGuide = this.registry.generateFilingGuide(options.formId, options.variables);
      content += `\n---\n\n${filingGuide}`;
    }

    // Footer
    content += this.generateFooter(
      dataSummary.authority,
      generatedDate,
      options.customFooter
    );

    return {
      markdownContent: content,
      metadata: {
        formName: dataSummary.formName,
        authority: dataSummary.authority,
        generatedDate,
        matterId: options.matterId,
      },
      filename: this.generateFilename(options.formId, options.matterId),
    };
  }

  /**
   * Generate header section
   */
  private generateHeader(formName: string, headerText: string): string {
    return `# ${headerText}\n\n` +
           `**Document Type:** Case Information Summary\n` +
           `**Official Form:** ${formName}\n` +
           `**Generated:** ${new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' })}\n\n`;
  }

  /**
   * Generate prominent disclaimer section
   */
  private generateDisclaimer(formName: string, officialUrl: string): string {
    return `---\n\n` +
           `## ⚠️ IMPORTANT NOTICE\n\n` +
           `**This is NOT an official court document.**\n\n` +
           `This summary is provided to help you organize your information. To file with the court/tribunal, you MUST:\n\n` +
           `1. Download the official ${formName} from: [${officialUrl}](${officialUrl})\n` +
           `2. Complete the official form using the information below\n` +
           `3. Sign and file the official form (not this summary)\n\n` +
           `**This is legal information, not legal advice.** Consider consulting a lawyer or licensed paralegal for advice specific to your situation.\n\n` +
           `---\n\n`;
  }

  /**
   * Generate visual data mapping table
   */
  private generateDataTable(dataSummary: {
    sections: Array<{
      title: string;
      rows: Array<{ field: string; value: string; instructions?: string }>;
    }>;
  }): string {
    let table = `## Your Information Summary\n\n`;
    table += `Use this table to copy information into the corresponding sections of the official form:\n\n`;

    dataSummary.sections.forEach(section => {
      table += `### ${section.title}\n\n`;
      table += `| Official Form Section | Your Information |\n`;
      table += `|----------------------|------------------|\n`;

      section.rows.forEach(row => {
        table += `| **${row.field}** | ${this.escapeMarkdown(row.value)} |\n`;
        
        if (row.instructions) {
          table += `| *Instructions:* | *${this.escapeMarkdown(row.instructions)}* |\n`;
        }
      });

      table += `\n`;
    });

    return table;
  }

  /**
   * Generate footer section
   */
  private generateFooter(authority: string, generatedDate: string, customFooter?: string): string {
    let footer = `\n---\n\n`;
    
    if (customFooter) {
      footer += customFooter + `\n\n`;
    }

    footer += `**Filing Authority:** ${authority}\n`;
    footer += `**Document Generated:** ${generatedDate}\n\n`;
    footer += `**Need Help?**\n`;
    footer += `- Free legal information: [Community Legal Education Ontario (CLEO)](https://www.cleo.on.ca/)\n`;
    footer += `- Find a lawyer: [Law Society Referral Service](https://lso.ca/public-resources/finding-a-lawyer-or-paralegal/law-society-referral-service)\n`;
    footer += `- Low-income legal aid: [Legal Aid Ontario](https://www.legalaid.on.ca/) - 1-800-668-8258\n\n`;

    return footer;
  }

  /**
   * Generate suggested filename
   */
  private generateFilename(formId: string, matterId?: string): string {
    const sanitizedFormId = formId.replace(/[^a-z0-9-]/gi, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (matterId) {
      return `${sanitizedFormId}_summary_matter-${matterId}_${timestamp}.md`;
    }
    
    return `${sanitizedFormId}_summary_${timestamp}.md`;
  }

  /**
   * Escape special Markdown characters
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/([|\\`*_{}[\]()#+\-.!])/g, '\\$1');
  }

  /**
   * Batch generate summaries for multiple forms
   */
  generateBatch(forms: Array<{ formId: string; variables: Record<string, any> }>): PDFSummaryResult[] {
    return forms.map(form => this.generateSummary(form));
  }

  /**
   * Get all available form IDs
   */
  getAvailableForms(): string[] {
    // This would ideally query the registry for all form IDs
    // For now, return the ones we've implemented
    return [
      'form-7a-small-claims',
      'ltb-form-t1',
      'ltb-form-l1',
      'victim-impact-statement',
    ];
  }

  /**
   * Check if form mapping exists
   */
  hasFormMapping(formId: string): boolean {
    return this.registry.getMapping(formId) !== undefined;
  }
}
