import { Domain } from '../models';

/**
 * Question types for intake wizard
 */
export type QuestionType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'currency'
  | 'select'
  | 'multi-select'
  | 'yes-no';

/**
 * Base question interface
 */
export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
}

/**
 * Question template for a domain
 */
export interface QuestionTemplate {
  domain: Domain;
  questions: Question[];
}

/**
 * Library of domain-specific intake questions
 */
export class QuestionnaireLibrary {
  private templates: Map<Domain, Question[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get questions for a specific domain
   */
  getQuestions(domain: Domain): Question[] {
    return this.templates.get(domain) || this.getDefaultQuestions();
  }

  /**
   * Get all templates
   */
  getAllTemplates(): QuestionTemplate[] {
    return Array.from(this.templates.entries()).map(([domain, questions]) => ({
      domain,
      questions,
    }));
  }

  /**
   * Initialize domain-specific question templates
   */
  private initializeTemplates(): void {
    // Legal Malpractice
    this.templates.set('legalMalpractice', [
      {
        id: 'lawyer_name',
        type: 'text',
        label: "What is your lawyer's name?",
        required: true,
        placeholder: 'e.g., Morgan Vance',
      },
      {
        id: 'law_firm',
        type: 'text',
        label: 'What law firm do they work for?',
        required: false,
        placeholder: 'e.g., Vance Legal Services',
      },
      {
        id: 'what_went_wrong',
        type: 'select',
        label: 'What did your lawyer do wrong?',
        required: true,
        options: [
          { value: 'missed_deadline', label: 'Missed a deadline or limitation period' },
          { value: 'bad_advice', label: 'Gave me bad legal advice' },
          { value: 'no_communication', label: "Didn't communicate with me" },
          { value: 'conflict_of_interest', label: 'Had a conflict of interest' },
          { value: 'billing_fraud', label: 'Overcharged or billed fraudulently' },
          { value: 'other', label: 'Something else' },
        ],
      },
      {
        id: 'deadline_details',
        type: 'textarea',
        label: 'Tell me more about the missed deadline',
        required: true,
        dependsOn: { questionId: 'what_went_wrong', value: 'missed_deadline' },
        placeholder: 'What deadline was missed? When was it supposed to be filed?',
      },
      {
        id: 'discovery_date',
        type: 'date',
        label: 'When did you discover the mistake?',
        required: true,
        helpText: 'This is important because the 2-year limitation period starts from discovery.',
      },
      {
        id: 'original_claim_type',
        type: 'select',
        label: 'What was your original case about?',
        required: true,
        options: [
          { value: 'personal_injury', label: 'Personal injury (slip-and-fall, car accident, etc.)' },
          { value: 'contract', label: 'Contract dispute' },
          { value: 'employment', label: 'Employment issue' },
          { value: 'family', label: 'Family law matter' },
          { value: 'real_estate', label: 'Real estate dispute' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'original_claim_value',
        type: 'currency',
        label: 'How much was your original claim worth?',
        required: true,
        helpText: 'This helps determine potential damages for the malpractice claim.',
        placeholder: '100000',
      },
      {
        id: 'have_evidence',
        type: 'yes-no',
        label: 'Do you have written proof of the mistake (emails, letters, etc.)?',
        required: true,
      },
    ]);

    // Criminal
    this.templates.set('criminal', [
      {
        id: 'your_role',
        type: 'select',
        label: 'What is your role in this case?',
        required: true,
        options: [
          { value: 'victim', label: 'I am the victim/complainant' },
          { value: 'witness', label: 'I am a witness' },
          { value: 'accused', label: 'I am the accused (facing charges)' },
        ],
      },
      {
        id: 'charge_type',
        type: 'select',
        label: 'What type of charges are involved?',
        required: true,
        options: [
          { value: 'assault', label: 'Assault or threats' },
          { value: 'sexual_assault', label: 'Sexual assault' },
          { value: 'theft', label: 'Theft or fraud' },
          { value: 'drug', label: 'Drug-related' },
          { value: 'domestic', label: 'Domestic violence' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'incident_date',
        type: 'date',
        label: 'When did the incident occur?',
        required: true,
      },
      {
        id: 'police_report_filed',
        type: 'yes-no',
        label: 'Has a police report been filed?',
        required: true,
      },
      {
        id: 'occurrence_number',
        type: 'text',
        label: 'Do you have the police occurrence/file number?',
        required: false,
        dependsOn: { questionId: 'police_report_filed', value: 'yes' },
        placeholder: 'e.g., 2025-12345',
      },
      {
        id: 'injuries_sustained',
        type: 'yes-no',
        label: 'Were there any injuries?',
        required: true,
        dependsOn: { questionId: 'your_role', value: 'victim' },
      },
      {
        id: 'medical_attention',
        type: 'yes-no',
        label: 'Did you receive medical attention?',
        required: true,
        dependsOn: { questionId: 'injuries_sustained', value: 'yes' },
      },
    ]);

    // Civil Negligence
    this.templates.set('civil-negligence', [
      {
        id: 'what_happened',
        type: 'select',
        label: 'What type of incident was it?',
        required: true,
        options: [
          { value: 'slip_fall', label: 'Slip-and-fall or trip-and-fall' },
          { value: 'car_accident', label: 'Car accident' },
          { value: 'property_damage', label: 'Property damage' },
          { value: 'product_defect', label: 'Defective product' },
          { value: 'medical', label: 'Medical negligence' },
          { value: 'other', label: 'Other negligence' },
        ],
      },
      {
        id: 'incident_date',
        type: 'date',
        label: 'When did this happen?',
        required: true,
        helpText: 'The 2-year limitation period starts from this date.',
      },
      {
        id: 'at_fault_party',
        type: 'text',
        label: 'Who do you think is responsible?',
        required: true,
        placeholder: 'e.g., XYZ Grocery Store, City of Toronto',
      },
      {
        id: 'injury_or_damage',
        type: 'select',
        label: 'What was the result?',
        required: true,
        options: [
          { value: 'personal_injury', label: 'Personal injury' },
          { value: 'property_damage', label: 'Property damage only' },
          { value: 'both', label: 'Both injury and property damage' },
        ],
      },
      {
        id: 'medical_treatment',
        type: 'yes-no',
        label: 'Did you receive medical treatment?',
        required: true,
        dependsOn: { questionId: 'injury_or_damage', value: ['personal_injury', 'both'] },
      },
      {
        id: 'estimated_damages',
        type: 'currency',
        label: 'Estimate the total damages (medical + property + lost wages)',
        required: true,
        placeholder: '5000',
        helpText: 'Claims under $50,000 go to Small Claims Court; larger claims go to Superior Court.',
      },
      {
        id: 'photos_taken',
        type: 'yes-no',
        label: 'Do you have photos of the scene or damage?',
        required: true,
      },
      {
        id: 'witnesses',
        type: 'yes-no',
        label: 'Were there any witnesses?',
        required: true,
      },
    ]);

    // Employment
    this.templates.set('employment', [
      {
        id: 'issue_type',
        type: 'select',
        label: 'What is the employment issue?',
        required: true,
        options: [
          { value: 'wrongful_dismissal', label: 'Wrongful dismissal / termination without cause' },
          { value: 'unpaid_wages', label: 'Unpaid wages or overtime' },
          { value: 'discrimination', label: 'Discrimination or harassment' },
          { value: 'constructive_dismissal', label: 'Constructive dismissal (forced to quit)' },
          { value: 'unsafe_work', label: 'Unsafe working conditions' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'employer_name',
        type: 'text',
        label: "What is your employer's name?",
        required: true,
      },
      {
        id: 'termination_date',
        type: 'date',
        label: 'When were you terminated?',
        required: true,
        dependsOn: { questionId: 'issue_type', value: ['wrongful_dismissal', 'constructive_dismissal'] },
      },
      {
        id: 'years_employed',
        type: 'text',
        label: 'How long did you work there?',
        required: true,
        placeholder: 'e.g., 5 years, 18 months',
        helpText: 'Length of service affects severance entitlement.',
      },
      {
        id: 'annual_salary',
        type: 'currency',
        label: 'What was your annual salary or hourly wage?',
        required: true,
        placeholder: '60000',
      },
      {
        id: 'received_severance',
        type: 'yes-no',
        label: 'Did you receive any severance pay?',
        required: true,
        dependsOn: { questionId: 'issue_type', value: 'wrongful_dismissal' },
      },
      {
        id: 'signed_release',
        type: 'yes-no',
        label: 'Have you signed a release or settlement agreement?',
        required: true,
        helpText: 'CRITICAL: If you signed a release, it may limit your options.',
      },
    ]);

    // Landlord/Tenant
    this.templates.set('landlordTenant', [
      {
        id: 'your_role',
        type: 'select',
        label: 'Are you the landlord or tenant?',
        required: true,
        options: [
          { value: 'tenant', label: 'Tenant' },
          { value: 'landlord', label: 'Landlord' },
        ],
      },
      {
        id: 'issue_type',
        type: 'select',
        label: 'What is the issue?',
        required: true,
        options: [
          { value: 'rent_increase', label: 'Unfair rent increase' },
          { value: 'eviction', label: 'Eviction notice / being asked to leave' },
          { value: 'repairs', label: 'Landlord refusing to do repairs' },
          { value: 'non_payment', label: 'Tenant not paying rent' },
          { value: 'deposit', label: 'Deposit or last month rent issue' },
          { value: 'harassment', label: 'Harassment or illegal entry' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'property_address',
        type: 'text',
        label: 'What is the rental property address?',
        required: true,
        placeholder: '123 Main St, Toronto, ON',
      },
      {
        id: 'monthly_rent',
        type: 'currency',
        label: 'What is the monthly rent?',
        required: true,
        placeholder: '1500',
      },
      {
        id: 'lease_type',
        type: 'select',
        label: 'What type of lease do you have?',
        required: true,
        options: [
          { value: 'month_to_month', label: 'Month-to-month' },
          { value: 'fixed_term', label: 'Fixed-term lease (e.g., 1 year)' },
          { value: 'no_written_lease', label: 'No written lease' },
        ],
      },
      {
        id: 'notice_received',
        type: 'yes-no',
        label: 'Have you received a notice (N-form or T-form)?',
        required: true,
      },
      {
        id: 'notice_type',
        type: 'text',
        label: 'What is the notice type?',
        required: false,
        dependsOn: { questionId: 'notice_received', value: 'yes' },
        placeholder: 'e.g., N4, N12, T2',
        helpText: 'The form number determines your deadline to respond.',
      },
    ]);

    // Consumer Protection
    this.templates.set('consumerProtection', [
      {
        id: 'issue_type',
        type: 'select',
        label: 'What is the consumer issue?',
        required: true,
        options: [
          { value: 'refund', label: 'Refund refused for defective product/service' },
          { value: 'warranty', label: 'Warranty claim denied' },
          { value: 'misrepresentation', label: 'False advertising or misrepresentation' },
          { value: 'unauthorized_charge', label: 'Unauthorized credit card charge' },
          { value: 'contract', label: 'Unfair contract terms' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'business_name',
        type: 'text',
        label: 'What is the business name?',
        required: true,
        placeholder: 'e.g., ABC Electronics',
      },
      {
        id: 'purchase_date',
        type: 'date',
        label: 'When did you make the purchase?',
        required: true,
      },
      {
        id: 'purchase_amount',
        type: 'currency',
        label: 'How much did you pay?',
        required: true,
        placeholder: '500',
      },
      {
        id: 'payment_method',
        type: 'select',
        label: 'How did you pay?',
        required: true,
        options: [
          { value: 'credit_card', label: 'Credit card' },
          { value: 'debit_card', label: 'Debit card' },
          { value: 'cash', label: 'Cash' },
          { value: 'cheque', label: 'Cheque' },
          { value: 'etransfer', label: 'E-transfer' },
        ],
      },
      {
        id: 'contacted_business',
        type: 'yes-no',
        label: 'Have you contacted the business to try to resolve this?',
        required: true,
      },
      {
        id: 'have_receipt',
        type: 'yes-no',
        label: 'Do you have a receipt or proof of purchase?',
        required: true,
      },
    ]);
  }

  /**
   * Default questions for unknown domains
   */
  private getDefaultQuestions(): Question[] {
    return [
      {
        id: 'issue_summary',
        type: 'textarea',
        label: 'Please describe your legal issue',
        required: true,
        placeholder: 'Tell us what happened...',
      },
      {
        id: 'incident_date',
        type: 'date',
        label: 'When did this happen?',
        required: true,
      },
      {
        id: 'parties_involved',
        type: 'text',
        label: 'Who else is involved?',
        required: false,
        placeholder: 'Names of other people, businesses, or organizations',
      },
      {
        id: 'estimated_value',
        type: 'currency',
        label: 'Estimated value of claim (if applicable)',
        required: false,
        placeholder: '0',
      },
    ];
  }
}
