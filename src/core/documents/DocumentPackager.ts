import { TemplateLibrary } from '../templates/TemplateLibrary';
import { DocumentDraft, DocumentPackage, PackagedFile, SourceManifest, EvidenceManifest } from '../models';
import { PDFSummaryGenerator } from './PDFSummaryGenerator';

export interface PackageInput {
  packageName: string;
  forumMap: string;
  timeline: string;
  missingEvidenceChecklist: string;
  drafts: DocumentDraft[];
  sourceManifest: SourceManifest;
  evidenceManifest: EvidenceManifest;
  jurisdiction?: string; // For PDF/A format requirement detection
  domain?: string; // For determining if OCPP compliance needed
  
  // NEW: For form mapping and professional PDF summaries
  formMappings?: Array<{ formId: string; variables: Record<string, any> }>;
  matterId?: string; // For tracking generated summaries
}

export class DocumentPackager {
  private templates: TemplateLibrary;
  private pdfSummaryGenerator: PDFSummaryGenerator;

  constructor(templates?: TemplateLibrary) {
    this.templates = templates ?? new TemplateLibrary();
    this.pdfSummaryGenerator = new PDFSummaryGenerator();
  }

  assemble(input: PackageInput): DocumentPackage {
    const layout = this.templates.packageLayout();
    const files: PackagedFile[] = [];
    const warnings: string[] = [];

    // Check if PDF/A format is required for this matter
    const requiresPDFA = this.requiresPDFAFormat(input.jurisdiction, input.domain);
    if (requiresPDFA) {
      warnings.push(
        'IMPORTANT: Toronto Region Superior Court requires PDF/A format for all filings.',
        'All documents must be converted to PDF/A-1b or PDF/A-2b before submission.',
        'See PDF_A_CONVERSION_GUIDE.md in this package for instructions.'
      );
    }

    // Required manifest files
    files.push({
      path: 'manifests/source_manifest.json',
      content: JSON.stringify(input.sourceManifest, null, 2)
    });
    files.push({
      path: 'manifests/evidence_manifest.json',
      content: JSON.stringify(input.evidenceManifest, null, 2)
    });

    // Core artifacts
    files.push({ path: 'forum_map.md', content: input.forumMap });
    files.push({ path: 'timeline.md', content: input.timeline });
    files.push({ path: 'missing_evidence.md', content: input.missingEvidenceChecklist });

    if (!input.drafts.length) {
      warnings.push('No draft documents provided.');
    } else {
      input.drafts.forEach((draft, idx) => {
        const safeName = this.slugify(draft.title || `draft-${idx + 1}`);
        const body = this.renderDraft(draft);
        files.push({ path: `drafts/${safeName}.md`, content: body });
      });
    }

    // Ensure template-required placeholders exist
    layout.files.forEach((path) => {
      if (!files.find((f) => f.path === path)) {
        files.push({ path, content: '# Placeholder\n' });
        warnings.push(`Added placeholder for missing template file: ${path}`);
      }
    });

    // Include domain templates as separate files for reference
    const domainTemplates = typeof (this.templates as any).domainTemplates === 'function' ? (this.templates as any).domainTemplates() : {};
    const templatePrefixes = this.getTemplatePrefixes(input.domain);
    Object.entries(domainTemplates).forEach(([id, content]) => {
      if (templatePrefixes.length && !templatePrefixes.some((prefix) => id.startsWith(`${prefix}/`))) {
        return; // Skip templates that are not relevant to the current domain
      }

      const safePath = `templates/${id}.md`;
      if (!files.find((f) => f.path === safePath)) {
        files.push({ path: safePath, content: String(content || '') });
      }
    });

    // Add PDF/A conversion guide if format requirements apply
    if (requiresPDFA) {
      files.push({
        path: 'PDF_A_CONVERSION_GUIDE.md',
        content: this.generatePDFAConversionGuide()
      });
    }

    // NEW: Generate professional form summaries with mapping instructions
    if (input.formMappings && input.formMappings.length > 0) {
      input.formMappings.forEach(mapping => {
        try {
          const summary = this.pdfSummaryGenerator.generateSummary({
            formId: mapping.formId,
            variables: mapping.variables,
            matterId: input.matterId,
            includeFilingGuide: true,
          });

          // Add both the data summary AND the filing guide
          files.push({
            path: `form_summaries/${summary.filename}`,
            content: summary.markdownContent
          });

          // Log successful generation
          console.log(`Generated form summary: ${summary.filename} for ${summary.metadata.formName}`);
        } catch (err) {
          warnings.push(`Failed to generate form summary for ${mapping.formId}: ${(err as Error).message}`);
        }
      });
    }

    return {
      name: input.packageName,
      folders: layout.folders,
      files,
      sourceManifest: input.sourceManifest,
      evidenceManifest: input.evidenceManifest,
      warnings: warnings.length ? warnings : undefined
    };
  }

  private renderDraft(draft: DocumentDraft): string {
    const sections = draft.sections
      .map((section) => {
        const refs = section.evidenceRefs
          .map((r) => `- Attachment ${r.attachmentIndex ?? r.evidenceId}${r.timestamp ? ` (${r.timestamp})` : ''}`)
          .join('\n');
        const confirmation = section.confirmed ? '' : '\n**Confirmation required before sending.**';
        const refsBlock = refs ? `\nEvidence References:\n${refs}` : '';
        return `## ${section.heading}\n${section.content}${confirmation}${refsBlock}`;
      })
      .join('\n\n');

    const disclaimer = draft.disclaimer ? `\n\n> ${draft.disclaimer}` : '';
    const citations = draft.citations
      .map((c) => `- ${c.label}: ${c.url} (retrieved ${c.retrievalDate})`)
      .join('\n');
    const citationsBlock = citations ? `\n\nCitations:\n${citations}` : '';

    const warnings: string[] = [];
    if (draft.missingConfirmations?.length) warnings.push(...draft.missingConfirmations);
    if (draft.styleWarnings?.length) warnings.push(...draft.styleWarnings);
    if (draft.citationWarnings?.length) warnings.push(...draft.citationWarnings);
    const warningBlock = warnings.length ? `\n\nWarnings:\n${warnings.map((w) => `- ${w}`).join('\n')}` : '';

    return `# ${draft.title}\n${sections}${citationsBlock}${disclaimer}${warningBlock}`;
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  /**
   * Determine if PDF/A format is required based on jurisdiction and domain
   */
  private requiresPDFAFormat(jurisdiction?: string, domain?: string): boolean {
    if (jurisdiction !== 'Ontario') return false;
    
    // OCPP-related domains require PDF/A for Toronto Region Superior Court
    const ocppDomains = ['ocppFiling', 'civilNegligence', 'municipalPropertyDamage'];
    return domain ? ocppDomains.includes(domain) : false;
  }

  /**
   * Map domain to template prefixes so we only include relevant reference materials.
   */
  private getTemplatePrefixes(domain?: string): string[] {
    switch (domain) {
      case 'civil-negligence':
      case 'civilNegligence':
        return ['civil'];
      case 'municipalPropertyDamage':
        return ['municipal'];
      case 'tree-damage':
      case 'treeDamage':
        return ['civil', 'municipal'];
      case 'landlordTenant':
        return ['ltb'];
      case 'consumerProtection':
        return ['consumer'];
      case 'legalMalpractice':
        return ['malpractice'];
      case 'estateSuccession':
        return ['estate'];
      case 'criminal':
        return ['criminal'];
      case 'insurance':
        return ['insurance'];
      case 'employment':
        return ['employment'];
      case 'humanRights':
      case 'human-rights':
        return ['human-rights'];
      case 'ocppFiling':
        return ['civil'];
      default:
        return [];
    }
  }

  /**
   * Generate PDF/A conversion guide for users
   */
  private generatePDFAConversionGuide(): string {
    return `# PDF/A Format Conversion Guide

## What is PDF/A?

PDF/A is an ISO-standardized version of PDF specialized for long-term digital preservation of electronic documents. The Toronto Region Superior Court requires PDF/A-1b or PDF/A-2b format for all OCPP filings effective October 2025.

## Why is PDF/A Required?

- **Long-term preservation**: Ensures documents remain accessible for decades
- **Court compliance**: Toronto Region Superior Court mandate (October 2025 reforms)
- **Document integrity**: Prevents changes and maintains formatting over time
- **Accessibility**: Better support for screen readers and assistive technologies

## How to Convert to PDF/A

### Option 1: LibreOffice (Free)

1. Open your document in LibreOffice Writer
2. Go to **File > Export as PDF**
3. In the PDF Options dialog:
   - Check **"PDF/A-1b (ISO 19005-1)"** or **"PDF/A-2b (ISO 19005-2)"**
   - Ensure **"Tagged PDF"** is checked for accessibility
4. Click **Export**
5. Save the file with a descriptive name (use only A-Z, 0-9, hyphens, underscores)

**Download**: https://www.libreoffice.org/download/

### Option 2: Microsoft Word (Office 365/2016+)

1. Open your document in Microsoft Word
2. Go to **File > Export > Create PDF/XPS Document**
3. Click **Options**
4. Under **PDF options**, check:
   - **"ISO 19005-1 compliant (PDF/A)"**
5. Click **OK**, then **Publish**

**Note**: Word defaults to PDF/A-1b. For PDF/A-2b, you may need Adobe Acrobat Pro.

### Option 3: Adobe Acrobat Pro (Paid)

1. Open your PDF in Adobe Acrobat Pro
2. Go to **Tools > Standards > Convert to PDF/A**
3. Select **PDF/A-1b** or **PDF/A-2b** from the dropdown
4. Click **OK**
5. Review and fix any compliance errors
6. Save the converted file

**Subscription**: https://www.adobe.com/acrobat/pricing.html

### Option 4: Online Converters (Use with Caution)

⚠️ **Privacy Warning**: Only use for non-sensitive documents. Court filings often contain personal information.

- **PDF2Go**: https://www.pdf2go.com/convert-to-pdfa
- **Smallpdf**: https://smallpdf.com/pdf-to-pdfa

**Recommended**: Use offline tools (LibreOffice, Word) for court documents.

## Verification

After conversion, verify PDF/A compliance:

1. **Adobe Acrobat Reader**:
   - Open the PDF
   - Go to **File > Properties > Description**
   - Check **PDF Version** shows "PDF/A-1b" or "PDF/A-2b"

2. **LibreOffice**:
   - Open the PDF in LibreOffice Draw
   - Go to **File > Properties > General**
   - Verify **PDF Standard** shows the correct version

## Naming Conventions

Toronto Region Superior Court requires:
- **Allowed characters**: A-Z, 0-9, hyphens (-), underscores (_)
- **File extension**: .pdf (lowercase or uppercase)
- **Example**: OCPP-Application-Smith-2025.pdf

## File Size Limits

- **Maximum**: 20MB per file
- **Tip**: If your file exceeds 20MB:
  - Compress images before converting to PDF/A
  - Split large documents into multiple files
  - Reduce image resolution (but maintain readability)

## Troubleshooting

**"This document is not PDF/A compliant" error**:
- Embedded multimedia: Remove videos/audio
- Encryption/passwords: Remove before converting
- Embedded fonts: Use standard fonts (Arial, Times New Roman)
- Transparency: Flatten transparent elements

**Need Help?**
- Contact the court registry for filing assistance
- Consult the [Ontario Court Forms Help Centre](https://www.ontariocourtforms.on.ca/)
- Review the [Small Claims Court User Guide](https://www.ontario.ca/document/small-claims-court-users-guide)

---

**Last Updated**: December 2025  
**Source**: Ontario Superior Court of Justice OCPP Requirements
`;
  }
}
