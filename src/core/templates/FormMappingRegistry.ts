/**
 * FormMappingRegistry: Maps our scaffold variables to official Ontario form fields
 * 
 * PURPOSE: Create a "bridge" between our generated data and official court/tribunal forms
 * UPL COMPLIANCE: We provide guidance, users complete official forms themselves
 * 
 * Structure:
 * - Each form has an official URL, sections, and field mappings
 * - Field mappings specify: our variable name → official form section → instructions
 * - Generates both PDF summaries and step-by-step filing guides
 */

export interface FormFieldMapping {
  /** Our variable name (e.g., "claimantName", "amountClaimed") */
  variableName: string;
  
  /** Official form section ID (e.g., "Box 1", "Section 3", "Item 4.2") */
  officialSection: string;
  
  /** Plain language description of where this goes */
  sectionLabel: string;
  
  /** Optional: Specific instructions for formatting/entering this field */
  instructions?: string;
  
  /** Optional: Example value to show users */
  example?: string;
}

export interface FormSection {
  /** Section identifier (e.g., "Part A - Claimant Information") */
  id: string;
  
  /** Section title as it appears on official form */
  title: string;
  
  /** Field mappings for this section */
  fields: FormFieldMapping[];
  
  /** Optional: General instructions for this section */
  notes?: string[];
}

export interface OfficialFormMapping {
  /** Form identifier (e.g., "form-7a-small-claims") */
  formId: string;
  
  /** Official form name */
  formName: string;
  
  /** URL to official fillable PDF */
  officialUrl: string;
  
  /** Court/tribunal that uses this form */
  authority: string;
  
  /** Jurisdiction (e.g., "Ontario") */
  jurisdiction: string;
  
  /** Form sections with field mappings */
  sections: FormSection[];
  
  /** Filing instructions specific to this form */
  filingInstructions: string[];
  
  /** Common mistakes to avoid */
  warnings?: string[];
  
  /** Form version/last updated (for maintenance tracking) */
  lastVerified?: string;
}

export class FormMappingRegistry {
  private mappings: Map<string, OfficialFormMapping>;

  constructor() {
    this.mappings = new Map();
    this.initializeOntarioForms();
  }

  /**
   * Get form mapping by ID
   */
  getMapping(formId: string): OfficialFormMapping | undefined {
    return this.mappings.get(formId);
  }

  /**
   * Get all mappings for a specific authority/court
   */
  getMappingsByAuthority(authority: string): OfficialFormMapping[] {
    return Array.from(this.mappings.values()).filter(m => m.authority === authority);
  }

  /**
   * Generate instructional overlay for a specific form
   * Returns step-by-step guide for completing official form
   */
  generateFilingGuide(formId: string, userVariables: Record<string, any>): string {
    const mapping = this.mappings.get(formId);
    if (!mapping) {
      return `# Error: No mapping found for ${formId}`;
    }

    let guide = `# How to Complete ${mapping.formName}\n\n`;
    guide += `**Official Form:** ${mapping.formName}\n`;
    guide += `**Download Link:** ${mapping.officialUrl}\n`;
    guide += `**Authority:** ${mapping.authority}\n\n`;

    guide += `---\n\n`;
    guide += `## Step-by-Step Instructions\n\n`;

    guide += `### Before You Begin\n\n`;
    guide += `1. Download the official form from the link above\n`;
    guide += `2. Print the form OR use a PDF editor to fill it electronically\n`;
    guide += `3. Have the information below ready to copy into the form\n\n`;

    if (mapping.warnings && mapping.warnings.length > 0) {
      guide += `### ⚠️ Important Warnings\n\n`;
      mapping.warnings.forEach(warning => {
        guide += `- ${warning}\n`;
      });
      guide += `\n`;
    }

    guide += `---\n\n`;
    guide += `## Your Information Summary\n\n`;
    guide += `Copy the following information into the corresponding sections of the official form:\n\n`;

    mapping.sections.forEach((section, idx) => {
      guide += `### ${idx + 1}. ${section.title}\n\n`;
      
      if (section.notes && section.notes.length > 0) {
        guide += `**Section Notes:**\n`;
        section.notes.forEach(note => guide += `- ${note}\n`);
        guide += `\n`;
      }

      guide += `| Official Form Field | Your Information |\n`;
      guide += `|---------------------|------------------|\n`;

      section.fields.forEach(field => {
        const value = userVariables[field.variableName] || `[${field.sectionLabel}]`;
        const displayValue = this.formatValueForDisplay(value);
        guide += `| **${field.officialSection}:** ${field.sectionLabel} | ${displayValue} |\n`;
        
        if (field.instructions) {
          guide += `| *Instructions:* | *${field.instructions}* |\n`;
        }
      });

      guide += `\n`;
    });

    guide += `---\n\n`;
    guide += `## Filing Instructions\n\n`;
    mapping.filingInstructions.forEach((instruction, idx) => {
      guide += `${idx + 1}. ${instruction}\n`;
    });

    guide += `\n---\n\n`;
    guide += `## Legal Disclaimer\n\n`;
    guide += `This is **information only**, not legal advice. This guide is provided to help you organize your information for completing the official ${mapping.formName}. The official form downloaded from ${mapping.officialUrl} is the only document accepted by ${mapping.authority}. Verify all information before submission. Consider consulting a lawyer or licensed paralegal for advice specific to your situation.\n`;

    return guide;
  }

  /**
   * Generate data summary table (for PDF generation)
   * Returns structured data ready for PDF rendering
   */
  generateDataSummary(formId: string, userVariables: Record<string, any>): {
    formName: string;
    officialUrl: string;
    authority: string;
    sections: Array<{
      title: string;
      rows: Array<{ field: string; value: string; instructions?: string }>;
    }>;
  } {
    const mapping = this.mappings.get(formId);
    if (!mapping) {
      throw new Error(`No mapping found for ${formId}`);
    }

    const sections = mapping.sections.map(section => ({
      title: section.title,
      rows: section.fields.map(field => ({
        field: `${field.officialSection}: ${field.sectionLabel}`,
        value: this.formatValueForDisplay(userVariables[field.variableName] || `[Not provided]`),
        instructions: field.instructions,
      })),
    }));

    return {
      formName: mapping.formName,
      officialUrl: mapping.officialUrl,
      authority: mapping.authority,
      sections,
    };
  }

  private formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) return '[Not provided]';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value);
  }

  /**
   * Initialize mappings for Ontario forms
   */
  private initializeOntarioForms(): void {
    // Small Claims Court - Form 7A (Statement of Claim)
    this.mappings.set('form-7a-small-claims', {
      formId: 'form-7a-small-claims',
      formName: 'Small Claims Court Form 7A - Statement of Claim',
      officialUrl: 'https://ontariocourtforms.on.ca/en/superior-court-of-justice/statement-of-claim/',
      authority: 'Superior Court of Justice - Small Claims Court',
      jurisdiction: 'Ontario',
      lastVerified: '2025-12-31',
      sections: [
        {
          id: 'part-a',
          title: 'Part A - Claimant Information',
          fields: [
            {
              variableName: 'claimantName',
              officialSection: 'Box 1',
              sectionLabel: 'Claimant Name',
              instructions: 'Full legal name as it appears on ID',
              example: 'Jane Smith',
            },
            {
              variableName: 'claimantAddress',
              officialSection: 'Box 1',
              sectionLabel: 'Claimant Address',
              instructions: 'Include street, city, province, postal code',
              example: '123 Main St, Toronto, ON M5V 1A1',
            },
            {
              variableName: 'claimantPhone',
              officialSection: 'Box 1',
              sectionLabel: 'Phone Number',
              instructions: 'Include area code',
              example: '416-555-0123',
            },
          ],
          notes: [
            'If representing yourself, check "Self-Represented" box',
            'If you have a representative, include their information in the designated area',
          ],
        },
        {
          id: 'part-b',
          title: 'Part B - Defendant Information',
          fields: [
            {
              variableName: 'respondentName',
              officialSection: 'Box 2',
              sectionLabel: 'Defendant Name',
              instructions: 'Full legal name or business name',
              example: 'ABC Construction Ltd.',
            },
            {
              variableName: 'respondentAddress',
              officialSection: 'Box 2',
              sectionLabel: 'Defendant Address',
              instructions: 'Last known address; required for service',
              example: '456 Business Rd, Toronto, ON M6K 2B2',
            },
          ],
          notes: [
            'Service address is critical - verify before filing',
            'For corporations, use registered office address from Ontario Business Registry',
          ],
        },
        {
          id: 'part-c',
          title: 'Part C - Claim Details',
          fields: [
            {
              variableName: 'amountClaimed',
              officialSection: 'Box 3',
              sectionLabel: 'Amount Claimed',
              instructions: 'Dollar amount only (do not include $ sign on form)',
              example: '5000.00',
            },
            {
              variableName: 'courtLocation',
              officialSection: 'Box 4',
              sectionLabel: 'Court Location',
              instructions: 'Choose court office where you will file (usually closest to defendant)',
              example: 'Toronto',
            },
            {
              variableName: 'incidentDate',
              officialSection: 'Section 5',
              sectionLabel: 'Date of Incident',
              instructions: 'Format: YYYY-MM-DD',
              example: '2024-06-15',
            },
            {
              variableName: 'particulars',
              officialSection: 'Section 6',
              sectionLabel: 'Reasons for Claim (Particulars)',
              instructions: 'Clear, factual description of what happened and why defendant owes you money. Use point-form for clarity.',
              example: '1. On [date], defendant damaged my property. 2. Repair costs totaled $X. 3. Defendant refused to pay despite demand letter.',
            },
          ],
          notes: [
            'Be specific and factual - avoid emotional language',
            'Attach supporting documents (photos, receipts, estimates) as exhibits',
            'Keep description under 500 words if possible',
          ],
        },
      ],
      filingInstructions: [
        'Complete the official Form 7A using the information above',
        'Sign the form in the designated signature area',
        'Make 3 copies: 1 for court, 1 for defendant, 1 for your records',
        'Pay filing fee at court office (fee varies by claim amount: $115-$315)',
        'File in person at Small Claims Court office or online via CaseLines (Toronto only)',
        'After filing, you must serve the defendant within 6 months',
      ],
      warnings: [
        'Filing fees are NON-REFUNDABLE even if you lose or withdraw your claim',
        'You have 2 years from the incident date to file (general limitation period)',
        'Small Claims Court maximum: $50,000 (as of October 2024)',
        'You MUST serve the defendant properly or your claim will be dismissed',
      ],
    });

    // LTB Form T1 (Tenant Application)
    this.mappings.set('ltb-form-t1', {
      formId: 'ltb-form-t1',
      formName: 'Landlord and Tenant Board Form T1 - Tenant Application',
      officialUrl: 'https://tribunalsontario.ca/ltb/forms-filing-and-fees/',
      authority: 'Landlord and Tenant Board',
      jurisdiction: 'Ontario',
      lastVerified: '2025-12-31',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1 - Tenant Information',
          fields: [
            {
              variableName: 'tenantName',
              officialSection: 'Item 1',
              sectionLabel: 'Tenant Name(s)',
              instructions: 'All tenants listed on lease',
              example: 'John Smith, Jane Smith',
            },
            {
              variableName: 'rentalAddress',
              officialSection: 'Item 2',
              sectionLabel: 'Rental Unit Address',
              instructions: 'Include unit number if applicable',
              example: 'Unit 301, 789 Elm Street, Toronto, ON M4W 1A1',
            },
            {
              variableName: 'tenantPhone',
              officialSection: 'Item 3',
              sectionLabel: 'Contact Phone',
              example: '416-555-0199',
            },
            {
              variableName: 'tenantEmail',
              officialSection: 'Item 3',
              sectionLabel: 'Email Address',
              example: 'jsmith@example.com',
            },
          ],
        },
        {
          id: 'section-2',
          title: 'Section 2 - Landlord Information',
          fields: [
            {
              variableName: 'landlordName',
              officialSection: 'Item 4',
              sectionLabel: 'Landlord Name',
              instructions: 'Property owner or property management company',
              example: 'ABC Property Management Inc.',
            },
            {
              variableName: 'landlordAddress',
              officialSection: 'Item 4',
              sectionLabel: 'Landlord Address',
              instructions: 'Service address for landlord',
              example: '100 Business Ave, Toronto, ON M5H 2N2',
            },
          ],
        },
        {
          id: 'section-3',
          title: 'Section 3 - Application Details',
          fields: [
            {
              variableName: 'applicationReason',
              officialSection: 'Item 5',
              sectionLabel: 'Reason for Application',
              instructions: 'Check appropriate box(es): rent increase, maintenance, harassment, etc.',
              example: 'Maintenance and repairs not completed',
            },
            {
              variableName: 'issueDescription',
              officialSection: 'Item 6',
              sectionLabel: 'Description of Issue',
              instructions: 'Factual description with dates, times, and specific incidents',
              example: 'Landlord has failed to repair leaking roof since October 2024 despite multiple written requests.',
            },
            {
              variableName: 'remedySought',
              officialSection: 'Item 7',
              sectionLabel: 'Remedy Requested',
              instructions: 'What you want the LTB to order (repair, rent reduction, etc.)',
              example: 'Order landlord to complete roof repairs within 30 days; rent reduction for period of disrepair',
            },
          ],
          notes: [
            'Attach evidence: photos, emails, repair requests, receipts',
            'Keep copies of everything you submit',
            'Be specific with dates and amounts',
          ],
        },
      ],
      filingInstructions: [
        'Complete official LTB Form T1 using information above',
        'Sign and date the form',
        'Make copies: 1 for LTB, 1 for landlord, 1 for your records',
        'File online via Tribunals Ontario Portal OR mail to LTB office',
        'Pay filing fee: $53 (can request fee waiver if low income)',
        'LTB will schedule hearing and notify you by mail (usually 4-8 weeks)',
        'Serve copy of application on landlord after filing',
      ],
      warnings: [
        'Do NOT withhold rent without LTB order - you can be evicted',
        'Attend your hearing or your application may be dismissed',
        'Bring all evidence to hearing (originals + 3 copies)',
        'LTB decisions are binding - limited appeal options',
      ],
    });

    // LTB Form L1 (Landlord Application for Eviction - Non-Payment)
    this.mappings.set('ltb-form-l1', {
      formId: 'ltb-form-l1',
      formName: 'Landlord and Tenant Board Form L1 - Application for Eviction (Non-Payment)',
      officialUrl: 'https://tribunalsontario.ca/ltb/forms-filing-and-fees/',
      authority: 'Landlord and Tenant Board',
      jurisdiction: 'Ontario',
      lastVerified: '2025-12-31',
      sections: [
        {
          id: 'landlord-info',
          title: 'Landlord Information',
          fields: [
            {
              variableName: 'landlordName',
              officialSection: 'Section A',
              sectionLabel: 'Landlord/Agent Name',
              example: 'Smith Property Management',
            },
            {
              variableName: 'landlordAddress',
              officialSection: 'Section A',
              sectionLabel: 'Landlord Address',
              example: '200 King St, Toronto, ON M5H 3T4',
            },
          ],
        },
        {
          id: 'tenant-info',
          title: 'Tenant Information',
          fields: [
            {
              variableName: 'tenantName',
              officialSection: 'Section B',
              sectionLabel: 'Tenant Name(s)',
              example: 'Alice Johnson',
            },
            {
              variableName: 'rentalAddress',
              officialSection: 'Section B',
              sectionLabel: 'Rental Unit Address',
              example: 'Apt 5B, 300 Queen St, Toronto, ON M5V 2A1',
            },
          ],
        },
        {
          id: 'arrears-details',
          title: 'Rent Arrears Details',
          fields: [
            {
              variableName: 'monthlyRent',
              officialSection: 'Section C',
              sectionLabel: 'Monthly Rent Amount',
              instructions: 'Lawful monthly rent',
              example: '1500.00',
            },
            {
              variableName: 'rentOwed',
              officialSection: 'Section C',
              sectionLabel: 'Total Rent Owed',
              instructions: 'Sum of all unpaid rent',
              example: '4500.00',
            },
            {
              variableName: 'periodOwed',
              officialSection: 'Section C',
              sectionLabel: 'Period of Arrears',
              instructions: 'List months rent is owed for',
              example: 'September 2024, October 2024, November 2024',
            },
          ],
          notes: [
            'Must attach rent ledger showing all payments and arrears',
            'Must have served N4 Notice (Notice to End Tenancy for Non-Payment) at least 14 days before filing',
          ],
        },
      ],
      filingInstructions: [
        'Serve N4 Notice to tenant (14-day notice for non-payment of rent)',
        'Wait for N4 notice period to expire',
        'Complete Form L1 if tenant has not paid or moved out',
        'File online or in person at LTB',
        'Pay filing fee: $201',
        'Serve copy of L1 application on tenant',
        'Attend hearing on scheduled date',
      ],
      warnings: [
        'You MUST serve N4 Notice before filing L1 - no exceptions',
        'Illegal lockouts or utility shutoffs can result in fines up to $50,000',
        'Only a sheriff can physically evict a tenant - never do it yourself',
        'Tenant can void eviction by paying arrears before hearing',
      ],
    });

    // Criminal Victim Impact Statement
    this.mappings.set('victim-impact-statement', {
      formId: 'victim-impact-statement',
      formName: 'Victim Impact Statement',
      officialUrl: 'https://www.ontario.ca/page/victim-impact-statement',
      authority: 'Ontario Court of Justice / Superior Court of Justice',
      jurisdiction: 'Ontario',
      lastVerified: '2025-12-31',
      sections: [
        {
          id: 'personal-info',
          title: 'Personal Information',
          fields: [
            {
              variableName: 'victimName',
              officialSection: 'Section 1',
              sectionLabel: 'Your Name',
              instructions: 'Full legal name',
            },
            {
              variableName: 'caseNumber',
              officialSection: 'Section 1',
              sectionLabel: 'Court File Number',
              instructions: 'Get from Crown Attorney or court documents',
              example: 'CR-24-12345',
            },
            {
              variableName: 'offenderName',
              officialSection: 'Section 1',
              sectionLabel: 'Offender Name',
              instructions: 'Name of accused/convicted person',
            },
          ],
        },
        {
          id: 'impact-statement',
          title: 'Impact Statement Content',
          fields: [
            {
              variableName: 'emotionalImpact',
              officialSection: 'Section 2.1',
              sectionLabel: 'Emotional Impact',
              instructions: 'Describe how the crime affected you emotionally (fear, anxiety, trauma, etc.)',
            },
            {
              variableName: 'physicalImpact',
              officialSection: 'Section 2.2',
              sectionLabel: 'Physical Impact',
              instructions: 'Describe any physical injuries or ongoing health issues',
            },
            {
              variableName: 'economicImpact',
              officialSection: 'Section 2.3',
              sectionLabel: 'Economic/Financial Impact',
              instructions: 'Medical bills, lost wages, damaged property, therapy costs',
            },
            {
              variableName: 'socialImpact',
              officialSection: 'Section 2.4',
              sectionLabel: 'Impact on Relationships/Daily Life',
              instructions: 'How crime affected family, work, school, social activities',
            },
          ],
          notes: [
            'Write in your own words - be honest and specific',
            'Focus on how the crime impacted YOU (not opinions about offender)',
            'You can include family members\' impacts if you are their representative',
            'Keep it factual and avoid inflammatory language',
          ],
        },
      ],
      filingInstructions: [
        'Contact Crown Attorney assigned to your case for guidance',
        'Complete statement in your own words',
        'Sign and date the statement',
        'Submit to Crown Attorney at least 2 weeks before sentencing hearing',
        'You may read your statement aloud in court or have Crown read it',
        'Crown will review and may suggest edits for legal compliance',
      ],
      warnings: [
        'This is used at SENTENCING only - not at trial to determine guilt',
        'Defense lawyer may cross-examine you on statement contents',
        'Statement becomes part of court record (public document)',
        'Do NOT include opinions about what sentence offender should receive',
        'Focus on impact, not blame or character attacks',
      ],
    });
  }
}
